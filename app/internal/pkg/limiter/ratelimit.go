package limiter

import (
	"net/http"
	"time"

	"app/internal/pkg/config"

	"github.com/go-chi/httprate"
	httprateredis "github.com/go-chi/httprate-redis"
	"github.com/redis/go-redis/v9"
)

type Limiter struct {
	GlobalRateLimit func(http.Handler) http.Handler
	Register        func(http.Handler) http.Handler
	AuthGroup       func(http.Handler) http.Handler
	Login           func(http.Handler) http.Handler
}

// NewLimiter pre-compiles your distributed rate limits at boot time
func NewLimiter(redisClient *redis.Client, cfg *config.Config) *Limiter {
	// 1. Configure the shared Redis backend config options block
	redisOptions := &httprateredis.Config{
		Client: redisClient,
	}

	return &Limiter{

		GlobalRateLimit: httprate.Limit(
			cfg.RateLimit.GlobalRequestsPerMinute,
			1*time.Minute,
			httprate.WithKeyFuncs(httprate.KeyByRealIP),
			httprateredis.WithRedisLimitCounter(redisOptions),
		),

		AuthGroup: httprate.Limit(
			cfg.RateLimit.AuthRequestsPerMinute,
			1*time.Minute,
			httprate.WithKeyFuncs(httprate.KeyByRealIP),
			httprateredis.WithRedisLimitCounter(redisOptions),
		),

		Register: httprate.Limit(
			cfg.RateLimit.RegisterRequestsPerMinute,
			1*time.Minute,
			httprate.WithKeyFuncs(httprate.KeyByRealIP),
			httprateredis.WithRedisLimitCounter(redisOptions),
		),

		Login: httprate.Limit(
			cfg.RateLimit.LoginRequestsPerMinute,
			1*time.Minute,
			httprate.WithKeyFuncs(httprate.KeyByRealIP),
			httprateredis.WithRedisLimitCounter(redisOptions),
		),
	}
}

// Custom remains a dynamic generator for flexible, ad-hoc overrides
func (l *Limiter) CustomLimiter(limit int, window time.Duration) func(http.Handler) http.Handler {
	return httprate.Limit(
		limit,
		window,
		httprate.WithKeyFuncs(httprate.KeyByRealIP),
	)
}
