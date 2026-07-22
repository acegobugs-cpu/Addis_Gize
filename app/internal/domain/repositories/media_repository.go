package repositories

import (
	"context"
	"fmt"
	"time"

	"app/internal/domain/entities"
	"app/internal/infra/database"
	"app/internal/pkg/logger"

	"github.com/google/uuid"
)

type MediaRepository struct {
	db *database.Postgres
}

func NewMediaRepository(db *database.Postgres) *MediaRepository {
	return &MediaRepository{db: db}
}

func (r *MediaRepository) Create(ctx context.Context, media *entities.Media) error {
	return nil
}

func (r *MediaRepository) ListAttached(ctx context.Context, limit, offset int) ([]entities.MediaItemRes, error) {
	query := `
		SELECT id, filename, url, type, source, created_at
		FROM media
		WHERE status = 'attached'
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query attached media: %w", err)
	}
	defer rows.Close()

	// Pre-allocate capacity to prevent nil JSON serialization and extra heap allocations
	list := make([]entities.MediaItemRes, 0, limit)

	for rows.Next() {
		var m entities.MediaItemRes
		err := rows.Scan(
			&m.ID,
			&m.FileName,
			&m.URL,
			&m.Type,
			&m.Source,
			&m.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan media row: %w", err)
		}
		list = append(list, m)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating media rows: %w", err)
	}

	return list, nil
}

func (r *MediaRepository) CreatePending(ctx context.Context, media *entities.Media) error {
	query := `
		INSERT INTO media (
			id,
			filename,
			bucket,
			storage_key,
			url,
			status,
			uploaded_by,
			type,
			source,
			thumbnail_id,
			created_at,
			updated_at
		) VALUES (
			$1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		)
			RETURNING id
	`

	err := r.db.QueryRow(
		ctx,
		query,
		media.ID,
		media.FileName,
		media.Bucket,
		media.StorageKey,
		media.URL,
		media.UploadedBy,
		media.Type,
		media.Source,
		media.ThumbnailID, // can be nil
	).Scan(&media.ID)
	if err != nil {
		logger.LogError(ctx, err, "")
		return fmt.Errorf("failed to insert pending media: %w", err)
	}

	return nil
}

func (r *MediaRepository) Attach(ctx context.Context, key string) (*uuid.UUID, error) {
	query := `
		UPDATE media 
		SET 
			status = 'attached',
			updated_at = CURRENT_TIMESTAMP
		WHERE storage_key = $1 AND status = 'pending'
		RETURNING id
	`

	var id uuid.UUID
	err := r.db.QueryRow(ctx, query, key).Scan(&id)
	if err != nil {
		logger.LogError(ctx, err, "failed to mark media as attached")
		return nil, fmt.Errorf("failed to attach media: %w", err)
	}

	return &id, nil
}

// DeletePendingOlderThan deletes pending DB rows older than the cutoff time and returns their storage keys
func (r *MediaRepository) DeletePendingOlderThan(ctx context.Context, cutoff time.Time) ([]string, error) {
	query := `
		DELETE FROM media
		WHERE status = 'pending' AND created_at < $1
		RETURNING storage_key
	`

	rows, err := r.db.Query(ctx, query, cutoff)
	if err != nil {
		return nil, fmt.Errorf("failed to delete expired pending media: %w", err)
	}
	defer rows.Close()

	var deletedKeys []string
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return nil, err
		}
		deletedKeys = append(deletedKeys, key)
	}

	return deletedKeys, rows.Err()
}

// FilterExistingKeys takes a list of storage keys and returns ONLY the ones that exist in PostgreSQL
func (r *MediaRepository) FilterExistingKeys(ctx context.Context, keys []string) (map[string]bool, error) {
	if len(keys) == 0 {
		return map[string]bool{}, nil
	}

	query := `
		SELECT storage_key FROM media
		WHERE storage_key = ANY($1)
	`

	rows, err := r.db.Query(ctx, query, keys)
	if err != nil {
		return nil, fmt.Errorf("failed to filter existing media keys: %w", err)
	}
	defer rows.Close()

	existing := make(map[string]bool)
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return nil, err
		}
		existing[key] = true
	}

	return existing, rows.Err()
}
