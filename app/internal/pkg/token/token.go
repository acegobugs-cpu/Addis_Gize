package token

import (
	"app/internal/domain/entities"
	"app/internal/pkg/errors"
	stdErrors "errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID  uuid.UUID `json:"user_id"`
	Version string    `json:"ver"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type TokenManager struct {
	jwtSecret      []byte
	accessDuration time.Duration
	issuer         string
}

func NewTokenManager(secret string, accessDuration time.Duration, issuer string) *TokenManager {
	return &TokenManager{
		jwtSecret:      []byte(secret),
		accessDuration: accessDuration,
		issuer:         issuer,
	}
}

func (m *TokenManager) GenerateAccessToken(user *entities.User) (string, string, error) {
	jti := uuid.New().String()
	now := time.Now()

	claims := &Claims{
		UserID:  user.ID,
		Version: "1.0",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			Audience:  jwt.ClaimStrings{m.issuer},
			ExpiresAt: jwt.NewNumericDate(now.Add(m.accessDuration)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    m.issuer,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString(m.jwtSecret)
	if err != nil {
		return "", "", err
	}

	return tokenStr, jti, nil
}

// ValidateAccessToken checks a token and cleanly preserves expiration error codes
func (m *TokenManager) ValidateAccessToken(tokenString string) (*Claims, error) {
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(m.issuer),
		jwt.WithAudience(m.issuer),
		jwt.WithExpirationRequired(),
	)

	token, err := parser.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.ErrInvalidCredentials
		}
		return m.jwtSecret, nil
	})

	if err != nil {
		// 🟢 FIX: Extract exact token expiration signature out of the v5 parser error block
		if stdErrors.Is(err, jwt.ErrTokenExpired) {
			return nil, jwt.ErrTokenExpired // Bubble up standard expiration error explicitly
		}
		return nil, errors.ErrInvalidCredentials
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.ErrInvalidCredentials
}

func (m *TokenManager) GetAccessDurationSeconds() int64 {
	return int64(m.accessDuration.Seconds())
}
