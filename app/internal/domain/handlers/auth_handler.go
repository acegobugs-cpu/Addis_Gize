package handlers

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"

	"app/internal/domain/appContext"
	"app/internal/domain/services"
	"app/internal/pkg/config"
	"app/internal/pkg/errors"

	"github.com/google/uuid"
)

// AuthHandler handles authentication HTTP requests
type AuthHandler struct {
	handler     *Handler
	authService *services.AuthService
	config      *config.Config
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *services.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		handler:     NewHandler(),
		authService: authService,
		config:      cfg,
	}
}

// RegisterRequest represents a user registration request
type SigninRequest struct {
	FirstName string `json:"first_name" validate:"required,min=2,max=50"`
	LastName  string `json:"last_name" validate:"required,min=2,max=50"`
	Username  string `json:"username" validate:"required,alphanum,min=3,max=30"`
	Email     string `json:"email" validate:"required,email"`
	Phone     string `json:"phone" validate:"required,e164"` // Validates international format
	Password  string `json:"password" validate:"required,min=8"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	EmailOrUsername string `json:"email_or_username"`
	Password        string `json:"password"`
}

type UserResponse struct {
	ID       uuid.UUID `json:"id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
}

func (h *AuthHandler) GetPendingInvitation(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "token is required", http.StatusBadRequest)
		return
	}

	res, err := h.authService.VerifyInvitation(ctx, token)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	// Return the data to the user's UI screen (omitting roles if they shouldn't see them)
	h.handler.RespondJSON(w, http.StatusOK, res)
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	req, ok := r.Context().Value(ValidatedBodyKey).(SigninRequest)
	if !ok {
		h.handler.RespondError(w, errors.ErrInternalServer.W("Failed to validate request", ""))
		return
	}

	user, err := h.authService.Signin(r.Context(), req.FirstName, req.LastName, req.Username, req.Email, req.Phone, req.Password)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	res := UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
	}

	h.handler.RespondJSON(w, http.StatusCreated, res)
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EmailOrUsername string `json:"email_or_username"`
		Password        string `json:"password"`
	}
	if err := h.handler.ParseJSON(r, &req); err != nil {
		h.handler.RespondError(w, errors.ErrInvalidInput)
		return
	}

	// 1. Extract the User-Agent header
	userAgent := r.Header.Get("User-Agent")
	// 2. Extract the IP Address (taking proxies/load balancers into account)
	ipAddress := h.readUserIP(r)

	// 3. Pass them into the updated service call
	user, tokens, err := h.authService.Login(r.Context(), req.EmailOrUsername, req.Password, ipAddress, userAgent)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.setAuthCookies(w, tokens.AccessToken, tokens.RefreshToken)

	res := UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
	}

	h.handler.RespondJSON(w, http.StatusOK, res)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 1. Pull the UserID securely out of the context (set by your middleware)
	userID, ok := appContext.GetUserID(ctx)
	if !ok || userID == uuid.Nil {
		h.handler.RespondError(w, errors.ErrUnauthorized.W("Unauthorized Access", "No user context found"))
		return
	}

	// Execute Service Layer Logic
	user, err := h.authService.Me(ctx, userID)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}

	// Construct and write the presentation response
	resp := UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// RefreshToken handles refreshing an access token via HttpOnly cookies
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	// 1. Extract the refresh token directly from the HttpOnly cookies
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		// Missing cookie means they aren't authenticated or session expired
		h.handler.RespondError(w, errors.ErrUnauthorized.W("Missing refresh token cookie", ""))
		return
	}
	refreshToken := cookie.Value

	// 2. Extract metadata for session tracking/security logs
	userAgent := r.Header.Get("User-Agent")
	ipAddress := h.readUserIP(r)

	// 3. Pass the extracted string token into your business layer
	tokens, err := h.authService.RefreshAccessToken(r.Context(), refreshToken, userAgent, ipAddress)
	if err != nil {
		h.handler.RespondError(w, err)
		return
	}
	h.setAuthCookies(w, tokens.AccessToken, tokens.RefreshToken)

	h.handler.RespondJSON(w, http.StatusOK, map[string]string{"message": "Tokens refreshed successfully"})
}

// Logout handles user logout by invalidating the database session and wiping the cookie
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var accessToken string
	var refreshToken string

	// 1. Try to extract Access Token from the Bearer Header first
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		accessToken = strings.TrimPrefix(authHeader, "Bearer ")
	}

	// 2. Fallback: Try to read Access Token from Cookie if header is missing
	if accessToken == "" {
		if atCookie, err := r.Cookie("access_token"); err == nil {
			accessToken = atCookie.Value
		}
	}

	// 3. Extract the Refresh Token from Cookies
	if rtCookie, err := r.Cookie("refresh_token"); err == nil {
		refreshToken = rtCookie.Value
	}

	// 4. Backend Cleanup: Invalidate the tokens in your database/Redis
	if refreshToken != "" {
		_ = h.authService.Logout(r.Context(), refreshToken)
	}
	if accessToken != "" {
		// Optional: If you maintain an access token denylist
		// _ = h.authService.DenylistAccessToken(r.Context(), accessToken)
	}

	// 5. Hard Eviction: Force the browser to delete BOTH cookies
	h.clearAuthCookies(w)

	h.handler.RespondJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// LogoutAll handles logging out from all devices
func (h *AuthHandler) LogoutAll(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.handler.GetUserIDFromContext(r)
	if !ok {
		h.handler.RespondError(w, errors.ErrUnauthorized)
		return
	}

	if err := h.authService.LogoutAll(r.Context(), userID); err != nil {
		h.handler.RespondError(w, err)
		return
	}

	h.clearAuthCookies(w)

	h.handler.RespondJSON(w, http.StatusOK, map[string]string{"message": "Logged out from all devices"})
}

func (h *AuthHandler) readUserIP(r *http.Request) string {
	// 1. Extract and parse the raw TCP connection IP address
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}

	directIP := net.ParseIP(strings.TrimSpace(host))
	if directIP == nil {
		return host // Fallback to raw string if completely unparseable
	}

	// 2. If the direct upstream load balancer isn't even trusted, stop immediately.
	if !h.config.IsTrustedProxy(directIP) {
		return directIP.String()
	}

	// 3. Process X-Forwarded-For sequentially from right to left
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		parts := strings.Split(xff, ",")

		// This tracks our active cursor across the proxy chain topology
		currentTrustedProxy := directIP

		for i := len(parts) - 1; i >= 0; i-- {
			candidateIP := net.ParseIP(strings.TrimSpace(parts[i]))
			if candidateIP == nil {
				// Skip malformed entries injected by attackers
				break
			}

			// If the current step in the chain was reached via a trusted proxy,
			// evaluate if this candidate is *also* a proxy or the client.
			if h.config.IsTrustedProxy(currentTrustedProxy) {
				if !h.config.IsTrustedProxy(candidateIP) {
					// Trust chain breaks here: client's actual external IP.
					return candidateIP.String()
				}
				// Another trusted proxy; keep moving left.
				currentTrustedProxy = candidateIP
			}
		}

		// If the entire chain was composed of trusted proxies, return the leftmost one
		if len(parts) > 0 {
			if leftmostIP := net.ParseIP(strings.TrimSpace(parts[0])); leftmostIP != nil {
				return leftmostIP.String()
			}
		}
	}

	// 4. Fallback to X-Real-IP if XFF was missing or inconclusive
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		if ip := net.ParseIP(strings.TrimSpace(xri)); ip != nil {
			return ip.String()
		}
	}

	return directIP.String()
}

func (h *AuthHandler) setAuthCookies(w http.ResponseWriter, accessToken, refreshToken string) {

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		MaxAge:   int(h.config.JWT.AccessDuration.Seconds()),
		HttpOnly: true,
		Secure:   h.config.Server.IsProd,
		SameSite: http.SameSiteStrictMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		MaxAge:   int(h.config.JWT.RefreshDuration.Seconds()),
		HttpOnly: true,
		Secure:   h.config.Server.IsProd,
		SameSite: http.SameSiteStrictMode,
	})

}

func (h *AuthHandler) clearAuthCookies(w http.ResponseWriter) {
	cookieSettings := []string{"access_token", "refresh_token"}

	for _, name := range cookieSettings {
		http.SetCookie(w, &http.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/", // Must exactly match the path configuration used when setting them
			MaxAge:   -1,  // Tells the browser to delete the cookie instantly
			HttpOnly: true,
			Secure:   h.config.Server.IsProd,
			SameSite: http.SameSiteStrictMode,
		})
	}
}
