package services

import (
	"context"
	"fmt"

	"app/internal/domain/entities"
	"app/internal/domain/repositories"
	"app/internal/pkg/errors"
	"app/internal/pkg/logger"

	"github.com/google/uuid"
)

// ArticleService handles article business logic
type ArticleService struct {
	articleRepo  *repositories.ArticleRepository
	categoryRepo *repositories.CategoryRepository
}

// NewArticleService creates a new article service
func NewArticleService(articleRepo *repositories.ArticleRepository, categoryRepo *repositories.CategoryRepository) *ArticleService {
	return &ArticleService{
		articleRepo:  articleRepo,
		categoryRepo: categoryRepo,
	}
}

type AddLocaleReq struct {
	ArticleID   *uuid.UUID     `json:"article_id"`
	Locale      string         `json:"locale"`
	Title       string         `json:"title"`
	Slug        string         `json:"slug"`
	Description string         `json:"description"`
	Content     map[string]any `json:"content,omitempty"`
}

// CreateArticle creates a new article
func (s *ArticleService) CreateArticle(ctx context.Context, article *entities.Article, categoryIDs []uuid.UUID) error {
	// Validate categories
	for _, catID := range categoryIDs {
		_, err := s.categoryRepo.FindByID(ctx, catID)
		if err != nil {
			return errors.ErrResourceNotFound
		}
	}

	// Create article
	if err := s.articleRepo.Create(ctx, article); err != nil {
		return errors.ErrInternalServer.W("Failed to create article", "")
	}

	// Add categories
	for _, catID := range categoryIDs {
		if err := s.articleRepo.AddCategory(ctx, article.ID, catID); err != nil {
			return errors.ErrInternalServer.W("Failed to add category to article", "")
		}
	}

	return nil
}

// CreateArticleLocale creates a new article locale
func (s *ArticleService) CreateArticleLocale(ctx context.Context, locale *entities.ArticleLocale) error {
	if err := s.articleRepo.CreateLocale(ctx, locale); err != nil {
		return errors.ErrInternalServer.W("Failed to create article locale", "")
	}
	return nil
}

// UpdateArticle updates an article
func (s *ArticleService) UpdateArticle(ctx context.Context, id uuid.UUID, patch entities.ArticlePatch) (*entities.Article, error) {
	// 1. Fetch existing article from storage
	article, err := s.articleRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.ErrNotFound.W("failed to fetch article", "")
	}

	// 2. Apply patch in-place on the domain entity
	article.ApplyPatch(patch)

	// 3. Persist updated entity via repository
	if err := s.articleRepo.Update(ctx, article); err != nil {
		return nil, fmt.Errorf("failed to update article in database: %w", err)
	}

	return article, nil
}

// GetArticleByID retrieves an article by ID
func (s *ArticleService) GetArticleByID(ctx context.Context, id uuid.UUID) (*entities.Article, error) {
	article, err := s.articleRepo.FindArticleByID(ctx, id)
	if err != nil {
		return nil, errors.ErrResourceNotFound
	}
	return article, nil
}

func (s *ArticleService) GetArticleLocales(ctx context.Context, id uuid.UUID) (*entities.Article, error) {
	article, err := s.articleRepo.FindArticleLocales(ctx, id)
	if err != nil {
		return nil, errors.ErrResourceNotFound
	}
	return article, nil
}

// GetArticleBySlug retrieves an article by slug and locale
func (s *ArticleService) GetArticleBySlug(ctx context.Context, slug string) (*entities.Story, error) {
	article, err := s.articleRepo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, errors.ErrResourceNotFound
	}
	return article, nil
}

// DeleteArticle deletes an article
func (s *ArticleService) DeleteArticle(ctx context.Context, id uuid.UUID) error {
	if err := s.articleRepo.Delete(ctx, id); err != nil {
		return errors.ErrInternalServer.W("Failed to delete article", "")
	}
	return nil
}

// ListArticles lists all articles with pagination
func (s *ArticleService) ListArticles(ctx context.Context, lan string, limit, offset int) ([]*entities.Article, error) {
	articles, err := s.articleRepo.List(ctx, lan, limit, offset)
	if err != nil {
		return nil, errors.ErrInternalServer.W("Failed to list articles", "")
	}
	return articles, nil
}

// ListArticles lists all articles with pagination
func (s *ArticleService) LanArticles(ctx context.Context, lan string, limit, offset int) ([]*entities.Story, error) {
	articles, err := s.articleRepo.ListStories(ctx, lan, limit, offset)
	if err != nil {
		return nil, errors.ErrInternalServer.W("Failed to list articles", "")
	}
	return articles, nil
}

// SearchArticles searches articles by query
func (s *ArticleService) SearchArticles(ctx context.Context, query string, limit, offset int) ([]*entities.Article, error) {
	articles, err := s.articleRepo.Search(ctx, query, limit, offset)
	if err != nil {
		return nil, errors.ErrInternalServer.W("Failed to search articles", "")
	}
	return articles, nil
}

func (s *ArticleService) ListArticlesByCategory(ctx context.Context, lang, cat string) (*entities.CategoryArticle, error) {
	categories, err := s.articleRepo.ListByCategory(ctx, lang, cat)
	if err != nil {
		logger.LogError(ctx, err, "")
		return nil, errors.ErrInternalServer.W("Failed to list articles by categories", "")
	}
	return categories, nil
}

func (s *ArticleService) ListArticlesByCategories(ctx context.Context, lang string) ([]*entities.CategoryArticle, error) {
	categories, err := s.articleRepo.ListByCategories(ctx, lang)
	if err != nil {
		logger.LogError(ctx, err, "")
		return nil, errors.ErrInternalServer.W("Failed to list articles by categories", "")
	}
	return categories, nil
}

// GetArticlesByCategory retrieves articles by category
func (s *ArticleService) GetArticlesByCategory(ctx context.Context, categoryID uuid.UUID, limit, offset int) ([]*entities.Article, error) {
	_, err := s.categoryRepo.FindByID(ctx, categoryID)
	if err != nil {
		return nil, errors.ErrResourceNotFound
	}

	articles, err := s.articleRepo.FindByCategory(ctx, categoryID)
	if err != nil {
		return nil, errors.ErrInternalServer.W("Failed to get articles by category", "")
	}
	return articles, nil
}

// UpdateArticleLocale updates an article locale
func (s *ArticleService) UpdateArticleLocale(ctx context.Context, locale *entities.ArticleLocale) error {
	if err := s.articleRepo.UpdateLocale(ctx, locale); err != nil {
		return errors.ErrInternalServer.W("Failed to update article locale", "")
	}
	return nil
}

// DeleteArticleLocale deletes an article locale
func (s *ArticleService) DeleteArticleLocale(ctx context.Context, id uuid.UUID) error {
	if err := s.articleRepo.DeleteLocale(ctx, id); err != nil {
		return errors.ErrInternalServer.W("Failed to delete article locale", "")
	}
	return nil
}
