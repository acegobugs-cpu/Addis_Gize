package entities

import (
	"time"

	"github.com/google/uuid"
)

// Article represents an article entity
type Article struct {
	ID           uuid.UUID        `json:"id"`
	Tag          string           `json:"tag"`
	Media        map[string]any   `json:"media,omitempty"`
	PublishedAt  time.Time        `json:"published_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	Translations []*ArticleLocale `json:"translations"`
	Categories   []Category       `json:"categories,omitempty"`
}

// NewArticle creates a new article entity
func NewArticle(tag string, media map[string]any) *Article {
	now := time.Now()
	return &Article{
		Tag:         tag,
		Media:       media,
		PublishedAt: now,
		UpdatedAt:   now,
	}
}

// TableName returns the database table name
func (a *Article) TableName() string {
	return "articles"
}

// ArticleLocale represents a localized version of an article
type ArticleLocale struct {
	ID          uuid.UUID      `json:"id"`
	ArticleID   *uuid.UUID     `json:"article_id"`
	EditorID    uuid.UUID      `json:"editor_id"`
	Locale      string         `json:"locale"`
	Title       string         `json:"title"`
	Slug        string         `json:"slug"`
	Description string         `json:"description"`
	Content     map[string]any `json:"content,omitempty"`
	PublishedAt time.Time      `json:"published_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// NewArticleLocale creates a new article locale entity
func NewArticleLocale(articleID *uuid.UUID, editorID uuid.UUID, locale, title, slug, description string) *ArticleLocale {
	now := time.Now()
	return &ArticleLocale{
		ArticleID:   articleID,
		EditorID:    editorID,
		Locale:      locale,
		Title:       title,
		Slug:        slug,
		Description: description,
		PublishedAt: now,
		UpdatedAt:   now,
	}
}

// TableName returns the database table name
func (al *ArticleLocale) TableName() string {
	return "article_locale"
}

type Story struct {
	ID          uuid.UUID      `json:"id"`
	ArticleID   *uuid.UUID     `json:"article_id"`
	Tag         string         `json:"tag"`
	Media       map[string]any `json:"media,omitempty"`
	Categories  []Category     `json:"categories,omitempty"`
	EditorID    uuid.UUID      `json:"editor_id"`
	Locale      string         `json:"locale"`
	Title       string         `json:"title"`
	Slug        string         `json:"slug"`
	Description string         `json:"description"`
	Content     map[string]any `json:"content,omitempty"`

	PublishedAt time.Time `json:"published_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TranslationPatch struct {
	ID          *uuid.UUID     `json:"id,omitempty"`
	EditorID    *uuid.UUID     `json:"editor_id,omitempty"`
	Locale      *string        `json:"locale,omitempty"`
	Title       *string        `json:"title,omitempty"`
	Slug        *string        `json:"slug,omitempty"`
	Description *string        `json:"description,omitempty"`
	Content     map[string]any `json:"content,omitempty"`
}

type ArticlePatch struct {
	Tag          *string           `json:"tag,omitempty"`
	Media        map[string]any    `json:"media,omitempty"`
	Categories   []Category        `json:"categories,omitempty"` // Fixed typo from 'categoreis'
	Translations *TranslationPatch `json:"translation"`
}

// ApplyPatch selectively updates existing fields on the Article entity
func (a *Article) ApplyPatch(patch ArticlePatch) {
	now := time.Now()
	a.UpdatedAt = now

	if patch.Tag != nil {
		a.Tag = *patch.Tag
	}

	if patch.Media != nil {
		a.Media = patch.Media
	}

	if patch.Categories != nil {
		a.Categories = patch.Categories
	}

	// Handle Translation Patching
	if patch.Translations != nil {
		tPatch := patch.Translations

		// Find matching existing translation by locale or ID
		var matchedLocale *ArticleLocale
		for _, loc := range a.Translations {
			if tPatch.Locale != nil && loc.Locale == *tPatch.Locale {
				matchedLocale = loc
				break
			}
			if tPatch.ID != nil && loc.ID == *tPatch.ID {
				matchedLocale = loc
				break
			}
		}

		// If existing locale match found, patch it in-place
		if matchedLocale != nil {
			matchedLocale.UpdatedAt = now

			if tPatch.EditorID != nil {
				matchedLocale.EditorID = *tPatch.EditorID
			}
			if tPatch.Title != nil {
				matchedLocale.Title = *tPatch.Title
			}
			if tPatch.Slug != nil {
				matchedLocale.Slug = *tPatch.Slug
			}
			if tPatch.Description != nil {
				matchedLocale.Description = *tPatch.Description
			}
			if tPatch.Content != nil {
				matchedLocale.Content = tPatch.Content
			}
		} else if tPatch.Locale != nil {
			// If locale didn't match an existing record, create a new locale entry
			newLocale := &ArticleLocale{
				ArticleID:   &a.ID,
				Locale:      *tPatch.Locale,
				PublishedAt: now,
				UpdatedAt:   now,
			}
			if tPatch.EditorID != nil {
				newLocale.EditorID = *tPatch.EditorID
			}
			if tPatch.Title != nil {
				newLocale.Title = *tPatch.Title
			}
			if tPatch.Slug != nil {
				newLocale.Slug = *tPatch.Slug
			}
			if tPatch.Description != nil {
				newLocale.Description = *tPatch.Description
			}
			if tPatch.Content != nil {
				newLocale.Content = tPatch.Content
			}

			a.Translations = append(a.Translations, newLocale)
		}
	}
}
