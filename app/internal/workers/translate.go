package workers

import (
	"app/internal/infra/search"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sashabaranov/go-openai"
)

var AllLocales = []string{"am", "en", "sw", "om"}

type ArticleLocaleRow struct {
	ID          uuid.UUID
	ArticleID   uuid.UUID
	Locale      string
	Title       string
	Description string
	Content     string
}

type AITranslationResponse struct {
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Content     json.RawMessage `json:"content"`
}

type TranslationWorker struct {
	pool      *pgxpool.Pool
	aiClient  *openai.Client
	searchSvc *search.ElasticSearch
	jobChan   chan uuid.UUID
}

func NewTranslationWorker(pool *pgxpool.Pool, aiClient *openai.Client, search *search.ElasticSearch) *TranslationWorker {
	return &TranslationWorker{
		pool:      pool,
		aiClient:  aiClient,
		searchSvc: search,
		jobChan:   make(chan uuid.UUID, 100),
	}
}

// ---------------------------------------------------------
// FEATURE 1: Background Async Queue (For Web Application)
// ---------------------------------------------------------

// Start launches worker goroutines that listen to the queue.
func (w *TranslationWorker) Start(ctx context.Context, workerCount int) {
	log.Printf("🚀 Starting %d background translation worker(s)...", workerCount)
	for i := 1; i <= workerCount; i++ {
		go func(workerID int) {
			for {
				select {
				case <-ctx.Done():
					log.Printf("[Worker %d] Stopping...", workerID)
					return
				case articleID := <-w.jobChan:
					log.Printf("[Worker %d] Processing Article ID: %s", workerID, articleID)
					jobCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
					if err := w.ProcessArticle(jobCtx, articleID); err != nil {
						log.Printf("[Worker %d] Error on %s: %v", workerID, articleID, err)
					}
					cancel()
				}
			}
		}(i)
	}
}

// Enqueue adds an article ID to the processing queue.
func (w *TranslationWorker) Enqueue(articleID uuid.UUID) {
	select {
	case w.jobChan <- articleID:
		log.Printf("📥 Article %s enqueued for background translation", articleID)
	default:
		log.Printf("⚠️ Translation queue full! Skipping Article %s", articleID)
	}
}

// ---------------------------------------------------------
// FEATURE 2: Bulk Database Migration (For CLI Jobs)
// ---------------------------------------------------------

// Run scans the entire database for any articles missing translations.
func (w *TranslationWorker) Run(ctx context.Context) error {
	rows, err := w.pool.Query(ctx, "SELECT DISTINCT article_id FROM article_locale")
	if err != nil {
		return fmt.Errorf("failed to fetch article IDs: %w", err)
	}
	defer rows.Close()

	var articleIDs []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err == nil {
			articleIDs = append(articleIDs, id)
		}
	}

	log.Printf("Found %d total articles to inspect.\n\n", len(articleIDs))

	for _, articleID := range articleIDs {
		if err := w.ProcessArticle(ctx, articleID); err != nil {
			log.Printf("[%s] Error processing article: %v\n", articleID, err)
		}
	}

	return nil
}

// ---------------------------------------------------------
// Core Processing Logic
// ---------------------------------------------------------

func (w *TranslationWorker) ProcessArticle(ctx context.Context, articleID uuid.UUID) error {
	rows, err := w.pool.Query(ctx, `
		SELECT id, article_id, locale, title, description, content 
		FROM article_locale 
		WHERE article_id = $1`, articleID)
	if err != nil {
		return fmt.Errorf("reading locales: %w", err)
	}
	defer rows.Close()

	existingLocales := make(map[string]ArticleLocaleRow)
	var sourceRow ArticleLocaleRow

	for rows.Next() {
		var r ArticleLocaleRow
		if err := rows.Scan(&r.ID, &r.ArticleID, &r.Locale, &r.Title, &r.Description, &r.Content); err == nil {
			existingLocales[r.Locale] = r
			sourceRow = r
		}
	}

	var missingLocales []string
	for _, loc := range AllLocales {
		if _, exists := existingLocales[loc]; !exists {
			missingLocales = append(missingLocales, loc)
		}
	}

	if len(missingLocales) == 0 {
		log.Printf("[%s] Skip: All translations already present.\n", articleID)
		return nil
	}

	log.Printf("[%s] Translating from '%s' -> Missing: %v\n", articleID, sourceRow.Locale, missingLocales)

	for _, targetLang := range missingLocales {
		translated, err := w.translateWithAI(ctx, sourceRow, targetLang)
		if err != nil {
			log.Printf("  ❌ Failed to translate to %s: %v\n", targetLang, err)
			continue
		}

		slug := GenerateSlug(translated.Title)

		_, err = w.pool.Exec(ctx, `
			INSERT INTO article_locale (id, article_id, locale, title, slug, description, content, is_ai_generated, editor_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, '0e6f099f-6156-482a-9526-8736c7348e6f')
			ON CONFLICT (article_id, locale) DO NOTHING`,
			uuid.New(), articleID, targetLang, translated.Title, slug, translated.Description, string(translated.Content),
		)

		if err != nil {
			log.Printf("  ❌ DB Save error (%s): %v\n", targetLang, err)
		} else {
			log.Printf("  ✅ Added '%s' translation!\n", targetLang)

			plainContent := ExtractTextFromTiptap(string(translated.Content))

			_ = w.searchSvc.IndexArticle(ctx, search.ArticleDocument{
				ID:          fmt.Sprintf("%s_%s", articleID, targetLang),
				ArticleID:   articleID.String(),
				Locale:      targetLang,
				Title:       translated.Title,
				Slug:        slug,
				Description: translated.Description,
				ContentText: plainContent,
				CreatedAt:   time.Now().Format(time.RFC3339),
			})
		}
	}

	return nil
}

func (w *TranslationWorker) translateWithAI(ctx context.Context, source ArticleLocaleRow, targetLang string) (*AITranslationResponse, error) {
	prompt := fmt.Sprintf(`
You are a precise news article translator.
Translate the following news article content from '%s' to '%s'.

STRICT RULES FOR CONTENT JSON (Tiptap Schema):
1. Preserve the EXACT JSON structure of "content".
2. Do NOT change node types, keys, structures, media tags, videos, figures, or formatting rules.
3. Translate ONLY text values inside "text": "..." fields.
4. Output valid JSON matching the exact schema specified below.

Language Key:
- 'am': Amharic
- 'en': English
- 'sw': Swahili
- 'om': Afaan Oromoo

Schema to return:
{
  "title": "translated title string",
  "description": "translated description string",
  "content": <exact_tiptap_json_tree_with_translated_text_nodes>
}

SOURCE DATA:
Title: %s
Description: %s
Content JSON: %s
`, source.Locale, targetLang, source.Title, source.Description, source.Content)

	req := openai.ChatCompletionRequest{
		Model: "llama-3.3-70b-versatile",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are a translator. You MUST respond with a valid JSON object strictly adhering to the requested format.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		ResponseFormat: &openai.ChatCompletionResponseFormat{
			Type: openai.ChatCompletionResponseFormatTypeJSONObject,
		},
	}

	resp, err := w.translateWithRetry(ctx, req)
	if err != nil {
		return nil, err
	}

	var result AITranslationResponse
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		return nil, fmt.Errorf("JSON parse error: %w", err)
	}

	return &result, nil
}

func (w *TranslationWorker) translateWithRetry(ctx context.Context, req openai.ChatCompletionRequest) (openai.ChatCompletionResponse, error) {
	maxRetries := 3
	backoff := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		resp, err := w.aiClient.CreateChatCompletion(ctx, req)
		if err == nil {
			return resp, nil
		}

		if strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "Rate limit") {
			time.Sleep(backoff)
			backoff *= 2
			continue
		}

		return resp, err
	}
	return openai.ChatCompletionResponse{}, fmt.Errorf("exceeded max retries")
}

func GenerateSlug(text string) string {
	reg := regexp.MustCompile(`[^\w\s\p{L}]`)
	cleaned := reg.ReplaceAllString(text, "")
	words := strings.Fields(cleaned)
	return strings.Join(words, "-")
}

func ExtractTextFromTiptap(tiptapJSON string) string {
	re := regexp.MustCompile(`"text"\s*:\s*"([^"]+)"`)
	matches := re.FindAllStringSubmatch(tiptapJSON, -1)

	var sb strings.Builder
	for _, m := range matches {
		if len(m) > 1 {
			sb.WriteString(m[1])
			sb.WriteString(" ")
		}
	}
	return strings.TrimSpace(sb.String())
}
