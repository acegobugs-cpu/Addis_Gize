package workers

import (
	"context"
	"fmt"
	"time"

	repository "app/internal/domain/repositories"
	"app/internal/infra/storage"
	"app/internal/pkg/logger"

	"github.com/robfig/cron/v3"
)

type MediaCronWorker struct {
	mediaRepo *repository.MediaRepository
	s3Storage *storage.S3Storage
	cron      *cron.Cron
}

func NewMediaCronWorker(mediaRepo *repository.MediaRepository, s3Storage *storage.S3Storage) *MediaCronWorker {
	return &MediaCronWorker{
		mediaRepo: mediaRepo,
		s3Storage: s3Storage,
		cron:      cron.New(),
	}
}

func (w *MediaCronWorker) Start(ctx context.Context) {
	// Job 1: Run every hour to delete pending records older than 2 hours
	_, err := w.cron.AddFunc("0 * * * *", func() {
		w.CleanupExpiredPendingMedia(context.Background())
	})
	if err != nil {
		logger.Error("Failed to schedule pending media cleanup job: " + err.Error())
	}

	// Job 2: Run once daily at 3:00 AM to sweep ghost/orphaned S3 files
	_, err = w.cron.AddFunc("0 3 * * *", func() {
		w.SweepGhostS3Files(context.Background())
	})
	if err != nil {
		logger.Error("Failed to schedule ghost S3 cleanup job: " + err.Error())
	}

	w.cron.Start()
	logger.Info("Media cron background workers started")
}

func (w *MediaCronWorker) Stop() {
	w.cron.Stop()
	logger.Info("Media cron background workers stopped")
}

// -----------------------------------------------------------------------------
// Job 1: Delete DB rows with status='pending' > 2 hours and their S3 objects
// -----------------------------------------------------------------------------
func (w *MediaCronWorker) CleanupExpiredPendingMedia(ctx context.Context) {
	logger.Info("[Cron] Starting CleanupExpiredPendingMedia...")

	// Delete pending records older than 2 hours
	cutoff := time.Now().Add(-2 * time.Hour)
	deletedKeys, err := w.mediaRepo.DeletePendingOlderThan(ctx, cutoff)
	if err != nil {
		logger.Error("[Cron] Failed to delete expired pending records: " + err.Error())
		return
	}

	if len(deletedKeys) == 0 {
		logger.Info("[Cron] No expired pending media found")
		return
	}

	// Clean up corresponding files from S3/MinIO
	successCount := 0
	for _, key := range deletedKeys {
		if err := w.s3Storage.DeleteFile(ctx, key); err != nil {
			logger.Error("[Cron] Failed to delete file from S3: " + key + " - " + err.Error())
			continue
		}
		successCount++
	}

	logger.Info(fmt.Sprintf("[Cron] Cleaned up %d/%d expired pending files", successCount, len(deletedKeys)))
}

// -----------------------------------------------------------------------------
// Job 2: Find files in S3 that don't exist in the database and delete them
// -----------------------------------------------------------------------------
func (w *MediaCronWorker) SweepGhostS3Files(ctx context.Context) {
	logger.Info("[Cron] Starting SweepGhostS3Files...")

	// 1. List all files currently in S3
	s3Keys, err := w.s3Storage.ListFiles(ctx)
	if err != nil {
		logger.Error("[Cron] Failed to list S3 files for ghost cleanup: " + err.Error())
		return
	}

	if len(s3Keys) == 0 {
		logger.Info("[Cron] No files in S3 bucket")
		return
	}

	// 2. Query Postgres to see which keys exist in the `media` table
	existingKeysMap, err := w.mediaRepo.FilterExistingKeys(ctx, s3Keys)
	if err != nil {
		logger.Error("[Cron] Failed to verify keys against database: " + err.Error())
		return
	}

	// 3. Delete any S3 key that has no entry in Postgres
	ghostCount := 0
	for _, s3Key := range s3Keys {
		if !existingKeysMap[s3Key] {
			logger.Info("[Cron] Deleting ghost file in S3: " + s3Key)
			if err := w.s3Storage.DeleteFile(ctx, s3Key); err != nil {
				logger.Error("[Cron] Failed to delete ghost file " + s3Key + ": " + err.Error())
				continue
			}
			ghostCount++
		}
	}

	logger.Info(fmt.Sprintf("[Cron] Ghost sweep complete. Purged %d orphaned files from S3", ghostCount))
}
