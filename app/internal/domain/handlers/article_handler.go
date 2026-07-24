package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

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
}

// NewArticleHandler creates a new article handler
func NewArticleHandler(articleService *services.ArticleService) *ArticleHandler {
	return &ArticleHandler{
		handler:        NewHandler(),
		articleService: articleService,
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
	Locale      string         `json:"locale"`
	Title       string         `json:"title"`
	Slug        string         `json:"slug"`
	Description string         `json:"description"`
	Content     map[string]any `json:"content,omitempty"`
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
		locale := entities.NewArticleLocale(nil, editorID, transReq.Locale, transReq.Title, transReq.Slug, transReq.Description)
		locale.Content = transReq.Content
		article.Translations = append(article.Translations, locale)
	}

	if err := h.articleService.CreateArticle(r.Context(), article, req.CategoryIDs); err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusCreated, article)
}

// UpdateArticle handles updating an article
func (h *ArticleHandler) UpdateArticle(w http.ResponseWriter, r *http.Request) {
	// 1. Extract Article ID from URL param
	idParam := chi.URLParam(r, "id")
	articleID, err := uuid.Parse(idParam)
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
	jsonBytes, err := json.MarshalIndent(patch.Translations.Content, "", "  ")
	if err != nil {
		logger.Error("failed to marshal content")
	} else {
		logger.Info(fmt.Sprintf("Incoming Content Payload:\n%s", string(jsonBytes)))
	}
	updatedArticle, err := h.articleService.UpdateArticle(r.Context(), articleID, patch)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusOK, updatedArticle)
}

// GetArticle handles getting an article by ID
func (h *ArticleHandler) GetArticle(w http.ResponseWriter, r *http.Request) {
	// Extract article ID from URL params
	// For now, this is a placeholder
	h.handler.RespondJSON(w, http.StatusOK, map[string]string{"message": "Get article endpoint"})
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
	res, err := h.articleService.ListArticles(ctx, 10, 0) // Example: limit=10, offset=0
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
	query := r.URL.Query().Get("q")
	if query == "" {
		h.handler.RespondError(w, errors.ErrInvalidInput.W("Missing search query", ""))
		return
	}
	res, err := h.articleService.SearchArticles(ctx, query, 10, 0) // Example: limit=10, offset=0
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.handler.RespondJSON(w, http.StatusOK, res)
}
