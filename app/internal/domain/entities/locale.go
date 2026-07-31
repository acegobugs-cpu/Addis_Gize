package entities

import (
	"database/sql/driver"
	"fmt"
)

// Locale represents supported article languages
type Locale string

const (
	LocaleAmharic Locale = "am"
	LocaleEnglish Locale = "en"
	LocaleSwahili Locale = "sw"
	LocaleOromo   Locale = "om" // Included based on your frontend options
)

// AllLocales provides a slice of all supported locales
var AllLocales = []Locale{
	LocaleAmharic,
	LocaleEnglish,
	LocaleSwahili,
	LocaleOromo,
}

// IsValid checks if a given locale string is supported
func (l Locale) IsValid() bool {
	switch l {
	case LocaleAmharic, LocaleEnglish, LocaleSwahili, LocaleOromo:
		return true
	default:
		return false
	}
}

// String returns the string representation of Locale
func (l Locale) String() string {
	return string(l)
}

// Value implements driver.Valuer for database operations (GORM/sqlx/pgx)
func (l Locale) Value() (driver.Value, error) {
	if !l.IsValid() {
		return nil, fmt.Errorf("invalid locale value: %s", l)
	}
	return string(l), nil
}

// Scan implements sql.Scanner for reading from the database
func (l *Locale) Scan(value any) error {
	if value == nil {
		*l = ""
		return nil
	}

	var str string
	switch v := value.(type) {
	case string:
		str = v
	case []byte:
		str = string(v)
	default:
		return fmt.Errorf("cannot scan type %T into Locale", value)
	}

	loc := Locale(str)
	if !loc.IsValid() {
		return fmt.Errorf("invalid locale in database: %s", str)
	}

	*l = loc
	return nil
}
