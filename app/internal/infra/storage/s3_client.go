package storage

import (
	"bytes"
	"context"
	"errors"
	"io"
	"time"

	con "app/internal/pkg/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
)

type S3Storage struct {
	client        *s3.Client
	presignClient *s3.PresignClient // Presign client wrapper
	bucketName    string
}

func NewS3Storage(ctx context.Context, s con.StorageConfig) (*S3Storage, error) {
	customProvider := credentials.NewStaticCredentialsProvider(s.AccessKey, s.SecretKey, "")

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(s.Region),
		config.WithCredentialsProvider(customProvider),
	)
	if err != nil {
		return nil, err
	}

	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		if s.Endpoint != "" {
			o.BaseEndpoint = aws.String(s.Endpoint)
			o.UsePathStyle = true
		}
	})

	// Initialize the PresignClient wrapping the S3 client
	presignClient := s3.NewPresignClient(s3Client)

	return &S3Storage{
		client:        s3Client,
		presignClient: presignClient,
		bucketName:    s.BucketName,
	}, nil
}

// UploadFile fulfills the interface required by your MediaService
func (s *S3Storage) UploadFile(ctx context.Context, content []byte, filename, contentType string) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{ // <-- Fixed this line
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(filename),
		Body:        bytes.NewReader(content),
		ContentType: aws.String(contentType),
	})
	return err
}

func (s *S3Storage) ListFiles(ctx context.Context) ([]string, error) {
	var fileKeys []string

	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(s.bucketName),
	}

	// Fetch objects from S3/LocalStack
	result, err := s.client.ListObjectsV2(ctx, input)
	if err != nil {
		return nil, err
	}

	for _, object := range result.Contents {
		if object.Key != nil {
			fileKeys = append(fileKeys, *object.Key)
		}
	}

	return fileKeys, nil
}

func (s *S3Storage) GetFile(ctx context.Context, filename string) (io.ReadCloser, string, error) {
	output, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(filename),
	})
	if err != nil {
		return nil, "", err
	}

	contentType := "application/octet-stream"
	if output.ContentType != nil {
		contentType = *output.ContentType
	}

	return output.Body, contentType, nil
}

func (s *S3Storage) CheckFileExists(ctx context.Context, filename string) (bool, error) {
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(filename),
	})
	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			// AWS and localstack return "NotFound" or "NoSuchKey" for missing keys
			if apiErr.ErrorCode() == "NotFound" || apiErr.ErrorCode() == "NoSuchKey" {
				return false, nil
			}
		}
		return false, err
	}
	return true, nil
}

// DeleteFile physically removes the object from the S3 bucket
func (s *S3Storage) DeleteFile(ctx context.Context, filename string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(filename),
	})
	return err
}

// GetPresignedPutURL generates a temporary URL for DIRECT CLIENT UPLOADS to S3.
// The client will perform an HTTP PUT directly to this URL.
func (s *S3Storage) GetPresignedPutURL(ctx context.Context, filename, contentType string, expiry time.Duration) (string, error) {
	req, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(filename),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", err
	}

	return req.URL, nil
}

// GetPresignedGetURL generates a temporary URL for SECURE DOWNLOADS/VIEWING.
// Useful for private buckets where images shouldn't be publicly readable permanently.
func (s *S3Storage) GetPresignedGetURL(ctx context.Context, filename string, expiry time.Duration) (string, error) {
	req, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(filename),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", err
	}

	return req.URL, nil
}
