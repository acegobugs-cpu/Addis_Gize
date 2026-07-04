package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	"app/internal/pkg/errors"
)

// ContextKey definitions to pass safely down the pipeline
type contextKey string

const ValidatedBodyKey contextKey = "validated_body"

// Handler unifies json utilities, context parsers, and input validation
type Handler struct {
	validator *validator.Validate
}

// NewHandler instances the complete utility toolbelt
func NewHandler() *Handler {
	return &Handler{
		validator: validator.New(),
	}
}

// RespondJSON handles all successful API responses using the unified layout
func (h *Handler) RespondJSON(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := errors.AppError{
		Success:    true,
		StatusCode: statusCode,
		Data:       data,
	}

	_ = json.NewEncoder(w).Encode(response)
}

// RespondError maps standard application failures to the exact same response structural layout
func (h *Handler) RespondError(w http.ResponseWriter, err error) {
	appErr := errors.FromAppError(err)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(appErr.GetStatusCode())

	_ = json.NewEncoder(w).Encode(appErr)
}

// ParseJSON acts as a raw parsing fallback if inline validation isn't used
func (h *Handler) ParseJSON(r *http.Request, v interface{}) error {
	r.Body = http.MaxBytesReader(nil, r.Body, 10<<20) // Protects memory size limits
	return json.NewDecoder(r.Body).Decode(v)
}

func (h *Handler) GetUserIDFromContext(r *http.Request) (uuid.UUID, bool) {
	userID, ok := r.Context().Value("user_id").(uuid.UUID)
	return userID, ok
}

func (h *Handler) GetRequestID(r *http.Request) string {
	requestID, ok := r.Context().Value("request_id").(string)
	if !ok {
		return ""
	}
	return requestID
}

// ValidateBody acts as an endpoint-specific inline middleware decorator
// 🟢 FIX: Receiver changed to *Handler so h.RespondError resolves correctly!
func ValidateBody[T any](h *Handler, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req T

		// 1. Centralized bounded reader + decode
		r.Body = http.MaxBytesReader(nil, r.Body, 10<<20) // Keeps max upload protection intact
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			h.RespondError(w, errors.ErrInvalidInput.W("Malformed JSON payload", err.Error()))
			return
		}

		// 2. Centralized Validation Run
		if err := h.validator.Struct(req); err != nil {
			// Optional improvement tip: loop through err.(validator.ValidationErrors) to fetch exact field names later
			h.RespondError(w, errors.ErrInvalidInput.W("Validation failed", err.Error()))
			return
		}

		// 3. Inject validated schema into Request Context
		ctx := context.WithValue(r.Context(), ValidatedBodyKey, req)
		next(w, r.WithContext(ctx))
	}
}
