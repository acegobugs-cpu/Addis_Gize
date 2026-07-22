package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"app/internal/domain/entities"
	"app/internal/infra/database"
	"app/internal/pkg/errors"
	"app/internal/pkg/logger"
)

// ArticleRepository implements ArticleRepository interface
type ArticleRepository struct {
	db *database.Postgres
}

// NewArticleRepository creates a new article repository
func NewArticleRepository(db *database.Postgres) *ArticleRepository {
	return &ArticleRepository{db: db}
}

func (r *ArticleRepository) Create(ctx context.Context, article *entities.Article) error {
	tx, err := r.db.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO articles (tag, media, published_at, updated_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	err = tx.QueryRow(ctx, query,
		article.Tag,
		article.Media,
		article.PublishedAt,
		article.UpdatedAt,
	).Scan(&article.ID)

	if err != nil {
		return fmt.Errorf("failed to create article: %w", err)
	}

	// Create locales
	for _, locale := range article.Translations {
		localeQuery := `
			INSERT INTO article_locale (article_id, editor_id, locale, title, slug, description, content, published_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING id
		`
		err = tx.QueryRow(ctx, localeQuery,
			article.ID,
			locale.EditorID,
			locale.Locale,
			locale.Title,
			locale.Slug,
			locale.Description,
			locale.Content,
			locale.PublishedAt,
			locale.UpdatedAt,
		).Scan(&locale.ID)

		if err != nil {
			logger.LogError(ctx, err, "")
			return fmt.Errorf("failed to create article locale: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *ArticleRepository) FindByID(ctx context.Context, id uuid.UUID) (*entities.Article, error) {
	query := `
		SELECT id, tag, media, published_at, updated_at
		FROM articles WHERE id = $1
	`
	article := &entities.Article{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&article.ID,
		&article.Tag,
		&article.Media,
		&article.PublishedAt,
		&article.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, errors.ErrResourceNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find article by ID: %w", err)
	}

	// Load locales
	article.Translations, err = r.FindLocalesByArticleID(ctx, article.ID)
	if err != nil {
		return nil, err
	}

	return article, nil
}

func (r *ArticleRepository) FindBySlug(ctx context.Context, slug, locale string) (*entities.Article, error) {
	query := `
		SELECT a.id, a.tag, a.media, a.published_at, a.updated_at
		FROM articles a
		INNER JOIN article_locale al ON a.id = al.article_id
		WHERE al.slug = $1 AND al.locale = $2
	`
	article := &entities.Article{}
	err := r.db.QueryRow(ctx, query, slug, locale).Scan(
		&article.ID,
		&article.Tag,
		&article.Media,
		&article.PublishedAt,
		&article.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, errors.ErrResourceNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find article by slug: %w", err)
	}

	article.Translations, err = r.FindLocalesByArticleID(ctx, article.ID)
	if err != nil {
		return nil, err
	}

	return article, nil
}

func (r *ArticleRepository) FindByTag(ctx context.Context, tag string) ([]*entities.Article, error) {
	query := `
		SELECT id, tag, media, published_at, updated_at
		FROM articles WHERE tag = $1
	`
	rows, err := r.db.Query(ctx, query, tag)
	if err != nil {
		return nil, fmt.Errorf("failed to find articles by tag: %w", err)
	}
	defer rows.Close()

	var articles []*entities.Article
	for rows.Next() {
		article := &entities.Article{}
		err := rows.Scan(
			&article.ID,
			&article.Tag,
			&article.Media,
			&article.PublishedAt,
			&article.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan article: %w", err)
		}
		articles = append(articles, article)
	}

	return articles, nil
}

func (r *ArticleRepository) FindByCategory(ctx context.Context, categoryID uuid.UUID) ([]*entities.Article, error) {
	query := `
		SELECT DISTINCT a.id, a.tag, a.media, a.published_at, a.updated_at
		FROM articles a
		INNER JOIN article_category ac ON a.id = ac.article_id
		WHERE ac.category_id = $1
	`
	rows, err := r.db.Query(ctx, query, categoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to find articles by category: %w", err)
	}
	defer rows.Close()

	var articles []*entities.Article
	for rows.Next() {
		article := &entities.Article{}
		err := rows.Scan(
			&article.ID,
			&article.Tag,
			&article.Media,
			&article.PublishedAt,
			&article.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan article: %w", err)
		}
		articles = append(articles, article)
	}

	return articles, nil
}

func (r *ArticleRepository) Update(ctx context.Context, article *entities.Article) error {
	query := `
		UPDATE articles 
		SET tag = $2, media = $3, updated_at = $4
		WHERE id = $1
	`
	err := r.db.Exec(ctx, query,
		article.ID,
		article.Tag,
		article.Media,
		article.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update article: %w", err)
	}
	return nil
}

func (r *ArticleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM articles WHERE id = $1`
	err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete article: %w", err)
	}
	return nil
}

func (r *ArticleRepository) List(ctx context.Context, limit, offset int) ([]*entities.Article, error) {
	// 1. Query selecting columns for both Article and ArticleLocale
	query := `
		SELECT 
			a.id, 
			a.tag, 
			a.media, 
			al.id,
			al.article_id,
			al.locale,
			al.title,
			al.slug,
			al.description,
			al.content,
			al.published_at, 
			al.updated_at
		FROM articles a
		INNER JOIN article_locale al ON a.id = al.article_id
		ORDER BY al.published_at DESC 
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list articles: %w", err)
	}
	defer rows.Close()

	// Map to track unique articles by UUID to prevent duplicates from JOIN
	articleMap := make(map[uuid.UUID]*entities.Article)
	var orderedIDs []uuid.UUID

	for rows.Next() {
		var (
			articleID  uuid.UUID
			tag        string
			media      map[string]any
			localeItem entities.ArticleLocale
		)

		// 2. Scan ALL 12 selected columns in exact order
		err := rows.Scan(
			&articleID,
			&tag,
			&media,
			&localeItem.ID,
			&localeItem.ArticleID,
			&localeItem.Locale,
			&localeItem.Title,
			&localeItem.Slug,
			&localeItem.Description,
			&localeItem.Content,
			&localeItem.PublishedAt,
			&localeItem.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan article row: %w", err)
		}

		// 3. Group locales into the parent Article
		article, exists := articleMap[articleID]
		if !exists {
			article = &entities.Article{
				ID:           articleID,
				Tag:          tag,
				Media:        media,
				PublishedAt:  localeItem.PublishedAt,
				UpdatedAt:    localeItem.UpdatedAt,
				Translations: []*entities.ArticleLocale{},
			}
			articleMap[articleID] = article
			orderedIDs = append(orderedIDs, articleID)
		}

		// Append locale to the article's Translations slice
		article.Translations = append(article.Translations, &localeItem)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	// 4. Preserve SQL ORDER BY sequence when building final slice
	articles := make([]*entities.Article, 0, len(orderedIDs))
	for _, id := range orderedIDs {
		articles = append(articles, articleMap[id])
	}

	return articles, nil
}

func (r *ArticleRepository) ListStories(ctx context.Context, lan string, limit, offset int) ([]*entities.Story, error) {
	query := `
        SELECT 
            a.id, 
            a.tag, 
            a.media, 
            al.published_at, 
            al.updated_at,
            al.title,
            al.slug,
            al.description,
            al.content
        FROM articles a
        INNER JOIN article_locale al ON a.id = al.article_id
        WHERE al.locale = $1
        ORDER BY a.published_at DESC 
        LIMIT $2 OFFSET $3
    `
	rows, err := r.db.Query(ctx, query, lan, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list articles: %w", err)
	}
	defer rows.Close()

	var articles []*entities.Story
	for rows.Next() {
		article := &entities.Story{}

		// Scan both base article fields and localized fields
		err := rows.Scan(
			&article.ID,
			&article.Tag,
			&article.Media,
			&article.PublishedAt,
			&article.UpdatedAt,
			&article.Title,       // Added from article_locale
			&article.Slug,        // Added from article_locale
			&article.Description, // Added from article_locale
			&article.Content,     // Added from article_locale
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan article: %w", err)
		}
		articles = append(articles, article)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return articles, nil
}

func (r *ArticleRepository) Search(ctx context.Context, query string, limit, offset int) ([]*entities.Article, error) {
	searchQuery := `
		SELECT DISTINCT a.id, a.tag, a.media, a.published_at, a.updated_at
		FROM articles a
		INNER JOIN article_locale al ON a.id = al.article_id
		WHERE al.title ILIKE $1 OR al.description ILIKE $1
		ORDER BY a.published_at DESC LIMIT $2 OFFSET $3
	`
	searchPattern := "%" + query + "%"
	rows, err := r.db.Query(ctx, searchQuery, searchPattern, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search articles: %w", err)
	}
	defer rows.Close()

	var articles []*entities.Article
	for rows.Next() {
		article := &entities.Article{}
		err := rows.Scan(
			&article.ID,
			&article.Tag,
			&article.Media,
			&article.PublishedAt,
			&article.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan article: %w", err)
		}
		articles = append(articles, article)
	}

	return articles, nil
}

func (r *ArticleRepository) AddCategory(ctx context.Context, articleID uuid.UUID, categoryID uuid.UUID) error {
	query := `
		INSERT INTO article_category (article_id, category_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`
	err := r.db.Exec(ctx, query, articleID, categoryID)
	if err != nil {
		return fmt.Errorf("failed to add category to article: %w", err)
	}
	return nil
}

func (r *ArticleRepository) RemoveCategory(ctx context.Context, articleID uuid.UUID, categoryID uuid.UUID) error {
	query := `DELETE FROM article_category WHERE article_id = $1 AND category_id = $2`
	err := r.db.Exec(ctx, query, articleID, categoryID)
	if err != nil {
		return fmt.Errorf("failed to remove category from article: %w", err)
	}
	return nil
}

func (r *ArticleRepository) CreateLocale(ctx context.Context, locale *entities.ArticleLocale) error {
	query := `
		INSERT INTO article_locale (article_id, editor_id, locale, title, slug, description, content, published_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	err := r.db.QueryRow(ctx, query,
		locale.ArticleID,
		locale.EditorID,
		locale.Locale,
		locale.Title,
		locale.Slug,
		locale.Description,
		locale.Content,
		locale.PublishedAt,
		locale.UpdatedAt,
	).Scan(&locale.ID)

	if err != nil {
		return fmt.Errorf("failed to create article locale: %w", err)
	}
	return nil
}

func (r *ArticleRepository) UpdateLocale(ctx context.Context, locale *entities.ArticleLocale) error {
	query := `
		UPDATE article_locale 
		SET title = $2, slug = $3, description = $4, content = $5, updated_at = $6
		WHERE id = $1
	`
	err := r.db.Exec(ctx, query,
		locale.ID,
		locale.Title,
		locale.Slug,
		locale.Description,
		locale.Content,
		locale.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update article locale: %w", err)
	}
	return nil
}

func (r *ArticleRepository) DeleteLocale(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM article_locale WHERE id = $1`
	err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete article locale: %w", err)
	}
	return nil
}

func (r *ArticleRepository) FindLocalesByArticleID(ctx context.Context, articleID uuid.UUID) ([]*entities.ArticleLocale, error) {
	query := `
		SELECT id, article_id, editor_id, locale, title, slug, description, content, published_at, updated_at
		FROM article_locale WHERE article_id = $1
	`
	rows, err := r.db.Query(ctx, query, articleID)
	if err != nil {
		return nil, fmt.Errorf("failed to find article locales: %w", err)
	}
	defer rows.Close()

	var locales []*entities.ArticleLocale
	for rows.Next() {
		locale := &entities.ArticleLocale{}
		err := rows.Scan(
			&locale.ID,
			&locale.ArticleID,
			&locale.EditorID,
			&locale.Locale,
			&locale.Title,
			&locale.Slug,
			&locale.Description,
			&locale.Content,
			&locale.PublishedAt,
			&locale.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan article locale: %w", err)
		}
		locales = append(locales, locale)
	}

	return locales, nil
}
