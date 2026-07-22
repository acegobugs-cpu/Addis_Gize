package services

import (
	"bytes"
	"context"
	"crypto/md5"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"app/internal/domain/entities"
	"app/internal/domain/repositories"
	"app/internal/infra/storage"

	"github.com/google/uuid"
)

// DTOs matching your FastAPI MediaReq and MediaRes
type MediaUploadReq struct {
	Type      string
	Source    string
	Caption   *string
	Thumbnail *string
	Controls  *int
	Alt       *string
	Credit    *string
}

type MediaService struct {
	repo         *repositories.MediaRepository
	minio        *storage.S3Storage
	maxFileSize  int64
	minioBaseURL string
}

func NewMediaService(repo *repositories.MediaRepository, minio *storage.S3Storage, maxFile int64, minioURL string) *MediaService {
	return &MediaService{
		repo:         repo,
		minio:        minio,
		maxFileSize:  maxFile,
		minioBaseURL: minioURL,
	}
}

// Custom errors to decouple business logic from HTTP status codes
var (
	ErrFileTooLarge = fmt.Errorf("file size exceeds maximum allowed limit")
	ErrStorageError = fmt.Errorf("failed to upload to storage")
	ErrFileNotFound = fmt.Errorf("file not found")
)

type MediaListRes struct {
	Files []entities.MediaItemRes `json:"files"`
}

type StorageKeys struct {
	Keys []string `json:"storageKeys"`
}

type GetPresignedURLRequest struct {
	Filename    string `json:"filename" validate:"required"`
	ContentType string `json:"content_type" validate:"required"` // e.g. "image/jpeg"
	Type        string `json:"type" validate:"required"`         // e.g. "article_image", "avatar"
	Source      string `json:"source" validate:"required"`
}

type GetPresignedURLResponse struct {
	MediaID    string    `json:"media_id"`
	StorageKey string    `json:"storage_key"`
	UploadURL  string    `json:"upload_url"`
	ExpiresAt  time.Time `json:"expires_at"`
}

func (s *MediaService) ListUploadedFiles(ctx context.Context, limit, offset int) (*MediaListRes, error) {
	mediaItems, err := s.repo.ListAttached(ctx, limit, offset)
	if err != nil {
		return nil, err
	}

	// files := make([]MediaItemRes, len(mediaItems))
	// for i, m := range mediaItems {
	// 	// Generate a 15-minute temporary presigned download URL
	// 	presignedURL, err := s.minio.GetPresignedGetURL(ctx, m.StorageKey, 15*time.Minute)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	files[i] = MediaItemRes{
	// 		ID:        m.ID,
	// 		Filename:  m.FileName,
	// 		URL:       presignedURL,
	// 		Type:      m.Type,
	// 		CreatedAt: m.CreatedAt,
	// 	}
	// }

	return &MediaListRes{Files: mediaItems}, nil
}

func (s *MediaService) Download(ctx context.Context, filename string) (io.ReadCloser, string, error) {
	// Business layer wrapper. You could add database lookups or download logging here.
	return s.minio.GetFile(ctx, filename)
}

func (s *MediaService) Upload(ctx context.Context, fileReader io.Reader, filename, contentType string, req MediaUploadReq) (*entities.Media, error) {
	var totalSize int64
	chunkSize := 64 * 1024 // 64KB
	buf := make([]byte, chunkSize)
	var content bytes.Buffer

	// 1. Read in chunks & validate size dynamically (mimicking the Python loop)
	for {
		n, err := fileReader.Read(buf)
		if n > 0 {
			totalSize += int64(n)
			if totalSize > s.maxFileSize {
				return nil, ErrFileTooLarge
			}
			content.Write(buf[:n])
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
	}

	fileBytes := content.Bytes()

	// 2. Hash and Filename construction
	hash := md5.Sum(fileBytes)
	fileHashHex := fmt.Sprintf("%x", hash)
	uniqueFilename := fmt.Sprintf("%s_%s", fileHashHex, filepath.Base(filename))

	fileURL := uniqueFilename
	if s.minioBaseURL != "" {
		fileURL = fmt.Sprintf("%s/%s", s.minioBaseURL, uniqueFilename)
	}

	// 3. Upload to Minio
	if err := s.minio.UploadFile(ctx, fileBytes, uniqueFilename, contentType); err != nil {
		return nil, ErrStorageError
	}

	// 4. Save to Database
	media := &entities.Media{
		FileName:   filename,
		StorageKey: fileURL,
		Type:       req.Type,
		Source:     req.Source,
	}

	if err := s.repo.Create(ctx, media); err != nil {
		return nil, err
	}

	return media, nil
}

func (s *MediaService) Replace(ctx context.Context, filename string, fileReader io.Reader, contentType string) error {
	// 1. Enforce existence verification
	exists, err := s.minio.CheckFileExists(ctx, filename)
	if err != nil {
		return err
	}
	if !exists {
		return ErrFileNotFound
	}

	// 2. Read in chunks & enforce max size constraint safely
	var totalSize int64
	chunkSize := 64 * 1024
	buf := make([]byte, chunkSize)
	var content bytes.Buffer

	for {
		n, err := fileReader.Read(buf)
		if n > 0 {
			totalSize += int64(n)
			if totalSize > s.maxFileSize {
				return ErrFileTooLarge
			}
			content.Write(buf[:n])
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}

	// 3. Overwrite file implicitly using the explicit original filename key
	return s.minio.UploadFile(ctx, content.Bytes(), filename, contentType)
}

func (s *MediaService) Delete(ctx context.Context, filename string) error {
	exists, err := s.minio.CheckFileExists(ctx, filename)
	if err != nil {
		return err
	}
	if !exists {
		return ErrFileNotFound
	}

	return s.minio.DeleteFile(ctx, filename)
}

func (s *MediaService) GetPresignedUploadURL(ctx context.Context, userID uuid.UUID, req GetPresignedURLRequest) (*GetPresignedURLResponse, error) {
	// 1. Generate a unique storage key (e.g., "articles/2026/07/uuid.jpg")
	ext := filepath.Ext(req.Filename)
	mediaID := uuid.New()
	now := time.Now()

	storageKey := fmt.Sprintf("uploads/%s/%d/%02d/%s%s",
		req.Type,
		now.Year(),
		now.Month(),
		mediaID.String(),
		ext,
	)
	url := fmt.Sprintf("%s/%s", s.minioBaseURL, storageKey)
	// 2. Insert record into Postgres with status = 'pending'
	media := &entities.Media{
		ID:         mediaID,
		FileName:   req.Filename,
		Bucket:     "articles", // Add getter in S3Storage if needed
		StorageKey: storageKey,
		URL:        url,
		UploadedBy: userID,
		Type:       req.Type,
		Source:     req.Source,
	}

	if err := s.repo.CreatePending(ctx, media); err != nil {
		return nil, fmt.Errorf("failed to save media metadata: %w", err)
	}

	// 3. Generate S3 Presigned PUT URL valid for 15 minutes
	expiry := 15 * time.Minute
	uploadURL, err := s.minio.GetPresignedPutURL(ctx, storageKey, req.ContentType, expiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned url: %w", err)
	}

	return &GetPresignedURLResponse{
		MediaID:    mediaID.String(),
		StorageKey: storageKey,
		UploadURL:  uploadURL,
		ExpiresAt:  now.Add(expiry),
	}, nil
}

func (s *MediaService) ConfirmUploads(ctx context.Context, req StorageKeys) ([]uuid.UUID, error) {
	var attachedIDs []uuid.UUID

	for _, key := range req.Keys {
		// 1. Verify existence in MinIO / S3
		exists, err := s.minio.CheckFileExists(ctx, key)
		if err != nil {
			return nil, fmt.Errorf("error checking file existence for %s: %w", key, err)
		}
		if !exists {
			return nil, fmt.Errorf("file was not found in S3 storage: %s", key)
		}

		// 2. Update status to 'attached' in PostgreSQL
		id, err := s.repo.Attach(ctx, key)
		if err != nil {
			return nil, fmt.Errorf("failed to attach media for key %s: %w", key, err)
		}

		attachedIDs = append(attachedIDs, *id)
	}

	return attachedIDs, nil
}
