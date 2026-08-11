package handlers

import (
	"app/internal/domain/appContext"
	"app/internal/domain/services"
	"app/internal/pkg/errors"
	"encoding/json"
	errs "errors"
	"io"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type MediaHandler struct {
	handler      *Handler
	mediaService *services.MediaService
}

func NewMediaHandler(mediaService *services.MediaService) *MediaHandler {
	return &MediaHandler{
		handler:      NewHandler(),
		mediaService: mediaService}
}

func (h *MediaHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Assumes your authentication middleware sets a "user" context value
	userID, ok := appContext.GetUserID(ctx)
	if !ok || userID == uuid.Nil {
		h.handler.RespondError(w, errors.ErrUnauthorized.W("Unauthorized Access", "No user context found"))
		return
	}

	// Parse Multipart Form (Max memory budget for parsing, e.g., 32MB)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	// 1. Extract File
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Missing file parameter", http.StatusBadRequest)
		return
	}
	defer file.Close()

	reqData := services.MediaUploadReq{
		Type:      r.FormValue("type"),
		Source:    r.FormValue("source"),
		Caption:   nil,
		Thumbnail: nil,
		Controls:  nil,
		Alt:       nil,
		Credit:    nil,
	}

	// 3. Call Service Layer
	media, err := h.mediaService.Upload(ctx, file, header.Filename, header.Header.Get("Content-Type"), reqData)
	if err != nil {
		if errs.Is(err, services.ErrFileTooLarge) {
			http.Error(w, err.Error(), http.StatusRequestEntityTooLarge) // 413
			return
		}
		if errs.Is(err, services.ErrStorageError) {
			http.Error(w, err.Error(), http.StatusInternalServerError) // 500
			return
		}
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// 4. Return Response (Equivalent to response_model=MediaRes, status_code=201)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(media)
}

func (h *MediaHandler) ListUploadedFiles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// // 1. Extract user context (Depends(get_current_user) equivalent)
	userID, ok := appContext.GetUserID(ctx)
	if !ok || userID == uuid.Nil {
		h.handler.RespondError(w, errors.ErrUnauthorized.W("Unauthorized Access", "No user context found"))
		return
	}

	// 2. Call Service Layer
	res, err := h.mediaService.ListUploadedFiles(ctx, 20, 1)
	if err != nil {
		http.Error(w, "Failed to retrieve file list", http.StatusInternalServerError)
		return
	}

	// 3. Return JSON response
	h.handler.RespondJSON(w, http.StatusOK, res)
}

func (h *MediaHandler) GetFile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Extract URL parameter: /upload/{filename} -> chi.URLParam(r, "filename")
	filename := chi.URLParam(r, "filename")
	if filename == "" {
		http.Error(w, "Filename parameter is required", http.StatusBadRequest)
		return
	}

	// Fetch file stream from service layer
	bodyStream, contentType, err := h.mediaService.Download(ctx, filename)
	if err != nil {
		// Type-assert AWS API specific errors to match Python's ClientError behavior
		var noSuchKey *types.NoSuchKey
		if errs.As(err, &noSuchKey) {
			http.Error(w, "File not found", http.StatusNotFound) // 404
			return
		}

		http.Error(w, "Internal Server Error", http.StatusInternalServerError) // 500
		return
	}
	// Crucial: Close the S3 network body stream when the HTTP request finishes
	defer bodyStream.Close()

	// Set response headers
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(http.StatusOK)

	// Stream directly to client: copies chunks from S3 network stream to HTTP response writer
	_, err = io.Copy(w, bodyStream)
	if err != nil {
		// Connection dropped mid-flight; log it if necessary, server can no longer write headers
		return
	}
}

// ReplaceFile corresponds to PUT /upload/{filename}
func (h *MediaHandler) ReplaceFile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	filename := chi.URLParam(r, "filename")

	if ctx.Value("user_id") == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Missing file parameter", http.StatusBadRequest)
		return
	}
	defer file.Close()

	err = h.mediaService.Replace(ctx, filename, file, header.Header.Get("Content-Type"))
	if err != nil {

		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "File replaced",
		"filename": filename,
	})
}

// DeleteFile corresponds to DELETE /upload/{filename}
func (h *MediaHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	filename := chi.URLParam(r, "filename")

	if ctx.Value("user_id") == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err := h.mediaService.Delete(ctx, filename)
	if err != nil {

		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// 204 No Content
	w.WriteHeader(http.StatusNoContent)
}

func (h *MediaHandler) GetPresignedUploadURL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 1. Extract authenticated user ID from context (injected by Auth Middleware)
	userID, ok := appContext.GetUserID(ctx)
	if !ok || userID == uuid.Nil {
		h.handler.RespondError(w, errors.ErrUnauthorized.W("Unauthorized Access", "No user context found"))
		return
	}

	// 2. Decode JSON body
	var req services.GetPresignedURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.handler.RespondError(w, errors.ErrBadRequest)
		return
	}

	// 3. Simple payload validation
	if req.Filename == "" || req.ContentType == "" || req.Type == "" {
		h.handler.RespondError(w, errors.ErrUnprocessableEntity)
		return
	}

	// 4. Delegate to Service
	res, err := h.mediaService.GetPresignedUploadURL(ctx, userID, req)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	// 5. Respond with URL and Media Metadata ID
	h.handler.RespondJSON(w, http.StatusOK, res)
}

func (h *MediaHandler) ConfirmUploads(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 1. Extract authenticated user ID from context (injected by Auth Middleware)
	userID, ok := appContext.GetUserID(ctx)
	if !ok || userID == uuid.Nil {
		h.handler.RespondError(w, errors.ErrUnauthorized.W("Unauthorized Access", "No user context found"))
		return
	}

	// 2. Decode JSON body
	var req services.StorageKeys
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.handler.RespondError(w, errors.ErrBadRequest)
		return
	}

	// 4. Delegate to Service
	res, err := h.mediaService.ConfirmUploads(ctx, req)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	// 5. Respond with URL and Media Metadata ID
	h.handler.RespondJSON(w, http.StatusOK, res)
}
