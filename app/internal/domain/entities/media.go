package entities

import (
	"time"

	"github.com/google/uuid"
)

// Media represents a media entity
type Media struct {
	ID          uuid.UUID  `json:"id"`
	Bucket      string     `json:"bucket"`
	StorageKey  string     `json:"storageKey"`
	FileName    string     `json:"fileName"`
	Status      string     `json:"status"`
	UploadedBy  uuid.UUID  `json:"uploadedBy"`
	Type        string     `json:"type"`
	Meta        any        `json:"metaData"`
	Source      string     `json:"source,omitempty"`
	ThumbnailID *uuid.UUID `json:"thumbnailID"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
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
