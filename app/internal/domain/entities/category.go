package entities

import (
	"encoding/json"

	"github.com/google/uuid"
)

type Cat struct {
	ID           uuid.UUID `json:"categoryId"`
	Translations map[Locale]CatTranslation
}

// Translation represents the data for a specific language
type CatTranslation struct {
	ID     uuid.UUID `json:"id"`
	Locale Locale    `json:"locale"`
	Name   string    `json:"name"`
	Slug   string    `json:"slug"`
}

// MarshalJSON flattens the Translations map into the root JSON object
func (c Cat) MarshalJSON() ([]byte, error) {
	// Create a dynamic map for JSON serialization
	m := make(map[string]interface{})

	// Assign the root ID
	m["id"] = c.ID

	// Inject each translation directly at the root level using the locale as the key
	for locale, translation := range c.Translations {
		m[string(locale)] = translation
	}

	return json.Marshal(m)
}

// UnmarshalJSON rebuilds the struct from the flattened JSON object
func (c *Cat) UnmarshalJSON(data []byte) error {
	// Unmarshal into a raw map first
	var m map[string]json.RawMessage
	if err := json.Unmarshal(data, &m); err != nil {
		return err
	}

	// Extract the ID
	if idBytes, ok := m["id"]; ok {
		if err := json.Unmarshal(idBytes, &c.ID); err != nil {
			return err
		}
		delete(m, "id") // Remove "id" so only locales remain in the map
	}

	// Initialize the map
	c.Translations = make(map[Locale]CatTranslation)

	// Iterate over remaining keys (which should be locales)
	for key, rawData := range m {
		var t CatTranslation
		if err := json.Unmarshal(rawData, &t); err != nil {
			return err
		}
		c.Translations[Locale(key)] = t

	}

	return nil
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
