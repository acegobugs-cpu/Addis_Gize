package entities

import (
	"github.com/google/uuid"
)

type Cat struct {
	ID uuid.UUID `json:"id"`
}

func NewCat() *Cat {
	return &Cat{
		ID: uuid.New(),
	}
}

func (c *Cat) TableName() string {
	return "categories"
}

// Category represents a category entity
type CategoryLocale struct {
	ID     uuid.UUID `json:"id"`
	Locale Locale    `json:"locale"`
	Name   string    `json:"name"`
	Slug   string    `json:"slug"`
	CatID  uuid.UUID `json:"catId"`
}

// NewCategory creates a new category entity
func NewCategory(locale Locale, name, slug string) *CategoryLocale {
	return &CategoryLocale{
		ID:     uuid.New(),
		Locale: locale,
		Name:   name,
		Slug:   slug,
	}
}

// TableName returns the database table name
func (c *CategoryLocale) TableName() string {
	return "categorie_locale"
}
