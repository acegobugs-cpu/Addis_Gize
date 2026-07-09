package http

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/unrolled/secure"
	"go.uber.org/zap"

	"app/internal/domain/handlers"
	"app/internal/infra/caching"
	"app/internal/pkg/config"
	"app/internal/pkg/limiter"
	"app/internal/pkg/logger"
	"app/internal/pkg/middleware"
	"app/internal/pkg/token"
)

// Router represents the HTTP router
type Router struct {
	router           *chi.Mux
	config           *config.Config
	cache            *caching.RedisCache
	handler          *handlers.Handler
	userHandler      *handlers.UserHandler
	authHandler      *handlers.AuthHandler
	articleHandler   *handlers.ArticleHandler
	categoryHandler  *handlers.CategoryHandler
	authEmailHandler *handlers.AuthorizedEmailHandler
	mediaHandler     *handlers.MediaHandler
	csrfProtection   *middleware.CSRFProtection
	authMiddleware   *middleware.AuthMiddleware
}

// NewRouter creates a new HTTP router
func NewRouter(
	config *config.Config,
	cache *caching.RedisCache,
	userHandler *handlers.UserHandler,
	authHandler *handlers.AuthHandler,
	articleHandler *handlers.ArticleHandler,
	categoryHandler *handlers.CategoryHandler,
	authEmailHandler *handlers.AuthorizedEmailHandler,
	mediaHandler *handlers.MediaHandler,
	tokenManager *token.TokenManager,
) *Router {
	r := chi.NewRouter()

	// Initialize CSRF protection
	csrfProtection, err := middleware.NewCSRFProtection(zap.L(), []byte(config.Security.CSRFSecretKey), config.Server.Environment == "production")
	if err != nil {
		logger.Fatal("Failed to initialize CSRF protection", zap.Error(err))
	}

	// Initialize authentication middleware
	authMiddleware := middleware.NewAuthMiddleware(tokenManager)

	router := &Router{
		router:           r,
		config:           config,
		cache:            cache,
		handler:          handlers.NewHandler(),
		userHandler:      userHandler,
		authHandler:      authHandler,
		articleHandler:   articleHandler,
		categoryHandler:  categoryHandler,
		authEmailHandler: authEmailHandler,
		mediaHandler:     mediaHandler,
		csrfProtection:   csrfProtection,
		authMiddleware:   authMiddleware,
	}

	router.MountRoutes()

	return router
}

func (r *Router) MountRoutes() http.Handler {
	// 1. Initialize your custom limiter once at the top
	l := limiter.NewLimiter(r.cache.Client, r.config)

	// 2. Set up global technical middlewares (passing the limiter)
	r.setupMiddleware(l)

	// 3. Define the application routing trees
	r.setupRoutes(l)

	return r.router
}

// setupMiddleware sets up global middleware
func (r *Router) setupMiddleware(l *limiter.Limiter) {
	// Basic middleware
	r.router.Use(chiMiddleware.RequestID)
	r.router.Use(chiMiddleware.RealIP)

	// FIX 1: Move secureMiddleware inside setupMiddleware so r.config is initialized and scoped correctly
	secureMiddleware := secure.New(secure.Options{
		// 1. Clickjacking Prevention
		FrameDeny: true, // Sets X-Frame-Options: DENY. Prevents embedding your API/pages in malicious iframes.

		// 2. MIME-Type Sniffing Protection
		ContentTypeNosniff: true, // Sets X-Content-Type-Options: nosniff. Prevents browsers from executing raw uploads as code.

		// 3. Strict Transport Security (HSTS)
		// ONLY enable this if your production site runs completely on HTTPS!
		STSSeconds:           31536000, // 1 Year enforcement
		STSIncludeSubdomains: true,     // Protects *.yoursite.com
		STSPreload:           true,     // Submits your domain to browser hardcoded HTTPS lists

		// 4. Content Security Policy (Decoupled & Modernized)
		ContentSecurityPolicy: strings.Join([]string{
			"default-src 'self'",
			// Allows your UI to fetch data from your Go API safely
			"connect-src 'self' http://localhost:8080 https://api.yoursite.com",
			// Essential Next.js runtime configurations (adjust strictly based on script needs)
			"script-src 'self' 'unsafe-eval' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob:",
		}, "; "),

		// 5. Deployment Environment Flag
		IsDevelopment: !r.config.Server.IsProd, // Disables HTTPS-only rules during local dev loop
	})
	r.router.Use(secureMiddleware.Handler)

	r.router.Use(chiMiddleware.Recoverer)
	r.router.Use(chiMiddleware.Logger)
	r.router.Use(middleware.Timeout(r.config.Server.ReadTimeout))
	r.router.Use(middleware.ContentType)

	// CORS
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   r.config.CORS.AllowedOrigins,
		AllowedMethods:   r.config.CORS.AllowedMethods,
		AllowedHeaders:   r.config.CORS.AllowedHeaders,
		AllowCredentials: r.config.CORS.AllowCredentials,
		MaxAge:           300,
	})
	r.router.Use(corsMiddleware.Handler)

	// // Rate limiting - use configured global rate limit, but wrap it to ignore OPTIONS requests
	// r.router.Use(func(next http.Handler) http.Handler {
	// 	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
	// 		if req.Method == http.MethodOptions {
	// 			next.ServeHTTP(w, req)
	// 			return
	// 		}
	// 		l.GlobalRateLimit(next).ServeHTTP(w, req)
	// 	})
	// })
}

// setupRoutes sets up application routes
func (r *Router) setupRoutes(l *limiter.Limiter) {
	// Health check
	r.router.Get("/health", r.healthCheck)
	r.router.Route("/api/v1", func(router chi.Router) {

		// Auth routes with per-endpoint rate limiting
		router.Route("/auth", func(router chi.Router) {

			router.Group(func(router chi.Router) {
				router.Get("/csrf/token", r.csrfProtection.GetCSRFTokenHandler)
				router.With(l.CustomLimiter(10, 1*time.Minute)).Get("/invitation", r.authHandler.GetPendingInvitation)
			})

			router.Group(func(router chi.Router) {
				// router.Use(l.AuthGroup)
				router.Use(r.csrfProtection.Middleware)
				router.With(l.Login).Post("/login", handlers.ValidateBody[handlers.LoginRequest](r.handler, r.authHandler.Login))
				router.With(l.Register).Post("/register", handlers.ValidateBody[handlers.SigninRequest](r.handler, r.authHandler.Register))
				router.With(l.CustomLimiter(10, 1*time.Minute)).Post("/refresh", r.authHandler.RefreshToken)
			})

			router.Group(func(router chi.Router) {
				router.Use(r.authMiddleware.Middleware)
				router.Get("/me", r.authHandler.Me)
			})

			router.Group(func(router chi.Router) {
				router.Use(r.csrfProtection.Middleware)
				router.Use(r.authMiddleware.Middleware)
				router.Post("/logout", r.authHandler.Logout)
				router.Post("/logout-all", r.authHandler.LogoutAll)
			})
		})

		// User routes with CSRF protection for state-changing operations
		router.Route("/users", func(router chi.Router) {
			router.With(r.csrfProtection.Middleware).Post("/invite", r.userHandler.Invite)
			router.With(r.authMiddleware.Middleware).Get("/invites", r.userHandler.GetInvitationList)
			router.With(r.authMiddleware.Middleware).Get("/", r.userHandler.ListUsers)
			router.Route("/{id}", func(router chi.Router) {
				router.With(r.authMiddleware.Middleware).Get("/", r.userHandler.GetUser)
				router.With(r.authMiddleware.Middleware).With(r.csrfProtection.Middleware).Put("/", r.userHandler.UpdateUser)
				router.With(r.authMiddleware.Middleware).With(r.csrfProtection.Middleware).Delete("/", r.userHandler.DeleteUser)
			})
		})

		// Article routes with CSRF protection for state-changing operations
		router.Route("/articles", func(router chi.Router) {
			router.Group(func(router chi.Router) {
				router.Get("/", r.articleHandler.ListArticles)
				router.Get("/search", r.articleHandler.SearchArticles)
				router.Get("/{id}", r.articleHandler.GetArticle)
				router.Get("/slug/{slug}", r.articleHandler.GetArticleBySlug)
			})

			router.Group(func(router chi.Router) {
				router.Use(r.csrfProtection.Middleware)
				router.Use(r.authMiddleware.Middleware)
				router.Post("/", r.articleHandler.CreateArticle)
				router.Route("/{id}", func(router chi.Router) {
					router.Put("/", r.articleHandler.UpdateArticle)
					router.Delete("/", r.articleHandler.DeleteArticle)
				})
			})
		})

		// Category routes with CSRF protection for state-changing operations
		router.Route("/categories", func(router chi.Router) {
			router.Group(func(router chi.Router) {
				router.Get("/", r.categoryHandler.ListCategories)
				router.Get("/{id}", r.categoryHandler.GetCategory)
				router.Get("/slug/{slug}", r.categoryHandler.GetCategoryBySlug)
			})

			router.Group(func(router chi.Router) {
				router.Use(r.csrfProtection.Middleware)
				router.Use(r.authMiddleware.Middleware)
				router.Post("/", handlers.ValidateBody[handlers.CreateCategoryRequest](r.handler, r.categoryHandler.CreateCategory))
				router.Route("/{id}", func(router chi.Router) {
					router.Put("/", r.categoryHandler.UpdateCategory)
					router.Delete("/", r.categoryHandler.DeleteCategory)
				})
			})
		})

		// Authorized email routes with CSRF protection for state-changing operations
		router.Route("/authorize-emails", func(router chi.Router) {
			router.With(r.csrfProtection.Middleware).With(r.authMiddleware.Middleware).Post("/", r.authEmailHandler.CreateAuthorizedEmail)
			router.With(r.authMiddleware.Middleware).Get("/", r.authEmailHandler.ListAuthorizedEmails)
			router.Route("/{slug}", func(router chi.Router) {
				router.With(r.authMiddleware.Middleware).Get("/", r.authEmailHandler.GetAuthorizedEmail)
				router.With(r.authMiddleware.Middleware).With(r.csrfProtection.Middleware).Post("/use", r.authEmailHandler.MarkAsUsed)
				router.With(r.authMiddleware.Middleware).With(r.csrfProtection.Middleware).Delete("/", r.authEmailHandler.DeleteAuthorizedEmail)
			})
		})

		router.Route("/uploads", func(router chi.Router) {
			router.Group(func(router chi.Router) {
				router.Use(r.authMiddleware.Middleware)
				router.Get("/", r.mediaHandler.ListUploadedFiles)
				router.Get("/{filename}", r.mediaHandler.GetFile)
			})

			router.Group(func(router chi.Router) {
				router.Use(r.csrfProtection.Middleware)
				router.Use(r.authMiddleware.Middleware)
				router.Post("/", r.mediaHandler.UploadFile)
				// router.Put("/:id")
				// router.Delete("/:id")
			})
		})
	})
}

// healthCheck handles health check requests
func (r *Router) healthCheck(w http.ResponseWriter, req *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// ServeHTTP implements http.Handler interface
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.router.ServeHTTP(w, req)
}

// Shutdown gracefully shuts down the HTTP server
func (r *Router) Shutdown(ctx context.Context, server *http.Server) error {
	return server.Shutdown(ctx)
}
