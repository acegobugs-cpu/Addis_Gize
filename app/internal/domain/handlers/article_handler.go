package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"app/internal/domain/appContext"
	"app/internal/domain/entities"
	"app/internal/domain/services"
	"app/internal/pkg/errors"
	"app/internal/pkg/logger"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ArticleHandler handles article HTTP requests
type ArticleHandler struct {
	handler        *Handler
	articleService *services.ArticleService
	searchService  *services.SearchService
}

// NewArticleHandler creates a new article handler
func NewArticleHandler(articleService *services.ArticleService, searchService *services.SearchService) *ArticleHandler {
	return &ArticleHandler{
		handler:        NewHandler(),
		articleService: articleService,
		searchService:  searchService,
	}
}

// CreateArticleRequest represents a create article request
type CreateArticleRequest struct {
	Tag          string                 `json:"tag"`
	Media        map[string]any         `json:"media,omitempty"`
	CategoryIDs  []uuid.UUID            `json:"category_ids"`
	Translations []ArticleLocaleRequest `json:"translations"`
}

// ArticleLocaleRequest represents an article locale request
type ArticleLocaleRequest struct {
	Locale      string          `json:"locale"`
	Title       string          `json:"title"`
	Slug        string          `json:"slug"`
	Description string          `json:"description"`
	Content     json.RawMessage `json:"content,omitempty"`
}

// CreateArticle handles creating a new article
func (h *ArticleHandler) CreateArticle(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req CreateArticleRequest
	if err := h.handler.ParseJSON(r, &req); err != nil {
		h.handler.RespondError(w, errors.ErrInvalidInput)
		return
	}

	// Get editor ID from context
	editorID, ok := appContext.GetUserID(ctx)
	if !ok {
		h.handler.RespondError(w, errors.ErrUnauthorized)
		return
	}

	// Create article entity
	article := entities.NewArticle(req.Tag, req.Media)

	// Create locales
	for _, transReq := range req.Translations {
		locale := entities.NewArticleLocale(nil, editorID, transReq.Locale, transReq.Title, transReq.Slug, transReq.Description, transReq.Content)
		article.Translations = append(article.Translations, locale)
	}

	if err := h.articleService.CreateArticle(r.Context(), article, req.CategoryIDs); err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusCreated, article)
}

func (h *ArticleHandler) AddLocale(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req services.AddLocaleReq
	if err := h.handler.ParseJSON(r, &req); err != nil {
		h.handler.RespondError(w, errors.ErrInvalidInput)
		return
	}

	// Get editor ID from context
	editorID, ok := appContext.GetUserID(ctx)
	if !ok {
		h.handler.RespondError(w, errors.ErrUnauthorized)
		return
	}

	// Create locale entity
	locale := entities.NewArticleLocale(req.ArticleID, editorID, req.Locale, req.Slug, req.Title, req.Description, req.Content)

	if err := h.articleService.CreateArticleLocale(r.Context(), locale); err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusCreated, locale)
}

// UpdateArticle handles updating an article
func (h *ArticleHandler) UpdateArticle(w http.ResponseWriter, r *http.Request) {
	// 1. Extract Article ID from URL param
	idParam := chi.URLParam(r, "id")
	localeID, err := uuid.Parse(idParam)
	if err != nil {
		h.handler.RespondError(w, errors.ErrInvalidInput.W("Invalid article ID", ""))
		return
	}

	// 2. Decode the patch body
	var patch entities.ArticlePatch
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
		h.handler.RespondError(w, errors.ErrInvalidInput.W("Invalid payload", ""))
		return
	}

	// 3. Delegate business logic / DB update to service
	updatedArticle, err := h.articleService.UpdateArticle(r.Context(), localeID, patch)
	if err != nil {
		logger.LogError(r.Context(), err, "")
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusOK, updatedArticle)
}

// GetArticle handles getting an article by ID
func (h *ArticleHandler) GetArticleByID(w http.ResponseWriter, r *http.Request) {
	// Extract article ID from URL params
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		h.handler.RespondError(w, errors.ErrBadRequest)
		return
	}
	article, err := h.articleService.GetArticleByID(r.Context(), id)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	// 3. Return the article JSON
	h.handler.RespondJSON(w, http.StatusOK, article)
}

func (h *ArticleHandler) GetArticleLocales(w http.ResponseWriter, r *http.Request) {
	// Extract article ID from URL params
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		h.handler.RespondError(w, errors.ErrBadRequest)
		return
	}
	article, err := h.articleService.GetArticleLocales(r.Context(), id)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	// 3. Return the article JSON
	h.handler.RespondJSON(w, http.StatusOK, article)
}

// GetArticleBySlug handles getting an article by slug
func (h *ArticleHandler) GetArticleBySlug(w http.ResponseWriter, r *http.Request) {
	// 1. Extract the slug from the URL parameters
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		h.handler.RespondError(w, errors.ErrBadRequest)
		return
	}

	// 2. Delegate fetching logic to the service layer
	article, err := h.articleService.GetArticleBySlug(r.Context(), slug)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	// 3. Return the article JSON
	h.handler.RespondJSON(w, http.StatusOK, article)
}

// DeleteArticle handles deleting an article
func (h *ArticleHandler) DeleteArticle(w http.ResponseWriter, r *http.Request) {
	h.handler.RespondJSON(w, http.StatusOK, map[string]string{"message": "Delete article endpoint"})
}

// ListArticles handles listing all articles
func (h *ArticleHandler) ListArticles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	query := r.URL.Query()

	// Read 'lang' query param (defaults to "" if omitted)
	lan := query.Get("lan")

	// Read 'limit' (default: 10)
	limit := 20
	if l := query.Get("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Read 'offset' (default: 0)
	offset := 0
	if o := query.Get("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}
	res, err := h.articleService.ListArticles(ctx, lan, limit, offset) // Example: limit=10, offset=0
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusOK, res)
}

func (h *ArticleHandler) LanArticles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	// 1. Extract the locale parameter from the URL path
	lan := chi.URLParam(r, "lan")
	if lan == "" {
		h.handler.RespondError(w, errors.ErrBadRequest.W(" ", ""))
		return
	}

	// 2. Pass the extracted locale string to your service
	res, err := h.articleService.LanArticles(ctx, lan, 10, 0)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusOK, res)
}

// SearchArticles handles searching articles
func (h *ArticleHandler) SearchArticles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	locale := chi.URLParam(r, "lan")
	query := r.URL.Query().Get("q")

	if query == "" {
		h.handler.RespondError(w, errors.ErrInvalidInput.W("Missing search query", ""))
		return
	}

	// Default values
	limit := 10
	from := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	if page := r.URL.Query().Get("page"); page != "" {
		if parsedPage, err := strconv.Atoi(page); err == nil && parsedPage > 1 {
			from = (parsedPage - 1) * limit
		}
	}

	res, err := h.searchService.Search(ctx, locale, query, from, limit)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusOK, res)
}

func (h *ArticleHandler) ArticlesByCategory(w http.ResponseWriter, r *http.Request) {
	// Extract 'lan' path param from chi router
	lang := chi.URLParam(r, "lan")
	if lang == "" {
		h.handler.RespondError(w, errors.ErrBadRequest.W("Language parameter is required", ""))
		return
	}

	cat := chi.URLParam(r, "slug")
	if cat == "" {
		h.handler.RespondError(w, errors.ErrBadRequest.W("Language parameter is required", ""))
		return
	}

	categories, err := h.articleService.ListArticlesByCategory(r.Context(), lang, cat)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusOK, categories)
}

func (h *ArticleHandler) ArticlesByCategories(w http.ResponseWriter, r *http.Request) {
	// Extract 'lan' path param from chi router
	lang := chi.URLParam(r, "lan")
	if lang == "" {
		h.handler.RespondError(w, errors.ErrBadRequest.W("Language parameter is required", ""))
		return
	}

	categories, err := h.articleService.ListArticlesByCategories(r.Context(), lang)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusOK, categories)
}
