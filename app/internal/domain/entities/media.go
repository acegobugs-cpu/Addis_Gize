package entities

import (
	"time"

	"github.com/google/uuid"
)

// Media represents a media entity
type Media struct {
	ID          uuid.UUID  `json:"id"`
	FileName    string     `json:"fileName"`
	Bucket      string     `json:"bucket"`
	StorageKey  string     `json:"storageKey"`
	URL         string     `json:"url"`
	Status      string     `json:"status"`
	UploadedBy  uuid.UUID  `json:"uploadedBy"`
	Type        string     `json:"type"`
	Meta        any        `json:"metaData"`
	Source      string     `json:"source,omitempty"`
	ThumbnailID *uuid.UUID `json:"thumbnailID"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type MediaItemRes struct {
	ID        uuid.UUID `json:"id"`
	FileName  string    `json:"fileName"`
	URL       string    `json:"url"`
	Type      string    `json:"type"`
	Source    string    `json:"source"`
	CreatedAt time.Time `json:"createdAt"`
}

// NewMedia creates a new media entity
func NewMedia(name, url, mediaType string) *Media {
	return &Media{
		FileName:   name,
		StorageKey: url,
		Type:       mediaType,
	}
}

// TableName returns the database table name
func (m *Media) TableName() string {
	return "media"
}
