package services

import (
	"context"

	"app/internal/domain/entities"
	"app/internal/domain/repositories"
	"app/internal/pkg/errors"

	"github.com/google/uuid"
)

// CategoryService handles category business logic
type CategoryService struct {
	categoryRepo *repositories.CategoryRepository
}

// NewCategoryService creates a new category service
func NewCategoryService(categoryRepo *repositories.CategoryRepository) *CategoryService {
	return &CategoryService{
		categoryRepo: categoryRepo,
	}
}

// CreateCategory creates a new category
func (s *CategoryService) CreateCategory(ctx context.Context, locale entities.Locale, name, slug string) (*entities.CategoryLocale, error) {
	// Check if slug already exists
	exists, err := s.categoryRepo.ExistsBySlug(ctx, slug)
	if err != nil {
		return nil, errors.ErrInternalServer.W("Failed to check slug existence", "")
	}
	if exists {
		return nil, errors.ErrConflict
	}

	// Check if name already exists
	exists, err = s.categoryRepo.ExistsByName(ctx, name)
	if err != nil {
		return nil, errors.ErrInternalServer.W("Failed to check name existence", "")
	}
	if exists {
		return nil, errors.ErrConflict
	}

	category := entities.NewCategory(locale, name, slug)
	if err := s.categoryRepo.Create(ctx, category); err != nil {
		return nil, errors.ErrInternalServer.W("Failed to create categoryy", "")
	}

	return category, nil

}

// GetCategoryByID retrieves a category by ID
func (s *CategoryService) GetCategoryByID(ctx context.Context, id uuid.UUID) (*entities.Cat, error) {
	category, err := s.categoryRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.ErrResourceNotFound
	}
	return category, nil
}

// GetCategoryBySlug retrieves a category by slug
func (s *CategoryService) GetCategoryBySlug(ctx context.Context, slug string) (*entities.CategoryLocale, error) {
	category, err := s.categoryRepo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, errors.ErrResourceNotFound
	}
	return category, nil
}

// UpdateCategory updates a category
func (s *CategoryService) UpsertCategory(ctx context.Context, id uuid.UUID, locale entities.Locale, name, slug string) error {
	category := entities.NewCategory(locale, name, slug)
	if err := s.categoryRepo.Upsert(ctx, id, category); err != nil {
		return errors.ErrInternalServer.W("Failed to update category", "")
	}
	return nil
}

// UpdateCategory updates a category
func (s *CategoryService) UpdateCategory(ctx context.Context, category *entities.CategoryLocale) error {
	if err := s.categoryRepo.Update(ctx, category); err != nil {
		return errors.ErrInternalServer.W("Failed to update category", "")
	}
	return nil
}

// DeleteCategory deletes a category
func (s *CategoryService) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	if err := s.categoryRepo.Delete(ctx, id); err != nil {
		return errors.ErrInternalServer.W("Failed to delete category", "")
	}
	return nil
}

// ListCategories lists all categories
func (s *CategoryService) ListCategories(ctx context.Context) ([]*entities.Cat, error) {
	categories, err := s.categoryRepo.List(ctx)
	if err != nil {
		return nil, errors.ErrInternalServer.W("Failed to list categories", "")
	}
	return categories, nil
}
