package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"app/internal/domain/entities"
	"app/internal/infra/database"
	"app/internal/pkg/errors"
)

// CategoryRepository implements CategoryRepository interface
type CategoryRepository struct {
	db *database.Postgres
}

// NewCategoryRepository creates a new category repository
func NewCategoryRepository(db *database.Postgres) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(ctx context.Context, category *entities.CategoryLocale) error {

	tx, err := r.db.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	// Defer rollback guarantees the transaction is aborted if it's not committed
	defer tx.Rollback(ctx)

	var cat entities.Cat
	query := `INSERT INTO categories DEFAULT VALUES RETURNONG id`

	err = tx.QueryRow(ctx, query).Scan(&cat.ID)
	if err != nil {
		return fmt.Errorf("failed to create base category: %w", err)
	}

	query = `
		INSERT INTO category_locale (locale, name, slug, category_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	err = tx.QueryRow(ctx, query, category.Locale, category.Name, category.Slug, cat.ID).Scan(&category.ID)
	if err != nil {
		return fmt.Errorf("failed to create category: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *CategoryRepository) AddLocale(ctx context.Context, category *entities.CategoryLocale, CatID *uuid.UUID) error {
	cat, err := r.FindByID(ctx, *CatID)
	if err != nil {
		return fmt.Errorf("parent category validation failed: %w", err)
	}
	query := `
		INSERT INTO category_locale (locale, name, slug, category_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	err = r.db.QueryRow(ctx, query, category.Locale, category.Name, category.Slug, cat.ID).Scan(&category.ID)

	if err != nil {
		return fmt.Errorf("failed to create category: %w", err)
	}
	return nil
}

func (r *CategoryRepository) FindByID(ctx context.Context, id uuid.UUID) (*entities.Cat, error) {
	query := `SELECT id FROM categories WHERE id = $1`
	category := &entities.Cat{}
	err := r.db.QueryRow(ctx, query, id).Scan(&category.ID)

	if err == pgx.ErrNoRows {
		return nil, errors.ErrResourceNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find category by ID: %w", err)
	}
	return category, nil
}

func (r *CategoryRepository) FindBySlug(ctx context.Context, slug string) (*entities.CategoryLocale, error) {
	query := `SELECT id, locale, name, slug FROM category_locale WHERE slug = $1`
	category := &entities.CategoryLocale{}
	err := r.db.QueryRow(ctx, query, slug).Scan(&category.ID, &category.Locale, &category.Name, &category.Slug)

	if err == pgx.ErrNoRows {
		return nil, errors.ErrResourceNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find category by slug: %w", err)
	}
	return category, nil
}

func (r *CategoryRepository) FindByName(ctx context.Context, name string) (*entities.CategoryLocale, error) {
	query := `SELECT id, locale, name, slug FROM category_locale WHERE name = $1`
	category := &entities.CategoryLocale{}
	err := r.db.QueryRow(ctx, query, name).Scan(&category.ID, &category.Locale, &category.Name, &category.Slug)

	if err == pgx.ErrNoRows {
		return nil, errors.ErrResourceNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find category by name: %w", err)
	}
	return category, nil
}

func (r *CategoryRepository) Update(ctx context.Context, category *entities.CategoryLocale) error {
	query := `UPDATE category_locale SET name = $2, slug = $3, locale = $4 WHERE id = $1`
	err := r.db.Exec(ctx, query, category.ID, category.Name, category.Slug)

	if err != nil {
		return fmt.Errorf("failed to update category: %w", err)
	}
	return nil
}

func (r *CategoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM categories WHERE id = $1`
	err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}
	return nil
}

func (r *CategoryRepository) List(ctx context.Context) ([]*entities.CategoryLocale, error) {
	query := `SELECT id, locale, name, slug FROM category_locale ORDER BY name`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	defer rows.Close()

	var categories []*entities.CategoryLocale
	for rows.Next() {
		category := &entities.CategoryLocale{}
		err := rows.Scan(&category.ID, &category.Locale, &category.Name, &category.Slug)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, category)
	}

	return categories, nil
}

func (r *CategoryRepository) ExistsBySlug(ctx context.Context, slug string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM category_locale WHERE slug = $1)`
	var exists bool
	err := r.db.QueryRow(ctx, query, slug).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check slug existence: %w", err)
	}
	return exists, nil
}

func (r *CategoryRepository) ExistsByName(ctx context.Context, name string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM category_locale WHERE name = $1)`
	var exists bool
	err := r.db.QueryRow(ctx, query, name).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check name existence: %w", err)
	}
	return exists, nil
}
