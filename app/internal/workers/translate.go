package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool" // Uses your pgxpool!
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
	pool     *pgxpool.Pool // Uses your existing pgxpool connection
	aiClient *openai.Client
}

func NewTranslationWorker(pool *pgxpool.Pool, aiClient *openai.Client) *TranslationWorker {
	return &TranslationWorker{
		pool:     pool,
		aiClient: aiClient,
	}
}

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
			VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, '8d64fb84-c7b6-42b4-89ce-e83ddaba8964')
			ON CONFLICT (article_id, locale) DO NOTHING`,
			uuid.New(), articleID, targetLang, translated.Title, slug, translated.Description, string(translated.Content),
		)

		if err != nil {
			log.Printf("  ❌ DB Save error (%s): %v\n", targetLang, err)
		} else {
			log.Printf("  ✅ Added '%s' translation!\n", targetLang)
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
5. Use the same editor.

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

	resp, err := w.aiClient.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: "llama-3.3-70b-versatile", // or your target model
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are a translator. You MUST respond with a valid JSON object strictly adhering to the requested format.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt, // Ensure prompt contains the word 'JSON'
			},
		},
		ResponseFormat: &openai.ChatCompletionResponseFormat{
			Type: openai.ChatCompletionResponseFormatTypeJSONObject,
		},
	})
	if err != nil {
		return nil, err
	}

	var result AITranslationResponse
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		return nil, fmt.Errorf("JSON parse error: %w", err)
	}

	return &result, nil
}

func GenerateSlug(text string) string {
	reg := regexp.MustCompile(`[^\w\s\p{L}]`)
	cleaned := reg.ReplaceAllString(text, "")
	words := strings.Fields(cleaned)
	return strings.Join(words, "-")
}

func (w *TranslationWorker) translateWithRetry(ctx context.Context, req openai.ChatCompletionRequest) (openai.ChatCompletionResponse, error) {
	maxRetries := 3
	backoff := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		resp, err := w.aiClient.CreateChatCompletion(ctx, req)
		if err == nil {
			return resp, nil
		}

		// Check if error is a rate limit (429)
		if strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "Rate limit") {
			time.Sleep(backoff)
			backoff *= 2 // Exponential backoff (2s, 4s, 8s)
			continue
		}

		return resp, err
	}
	return openai.ChatCompletionResponse{}, nil
}
