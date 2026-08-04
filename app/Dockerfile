# Stage 1: Build the Go binary
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Stage 2: Minimal runtime environment
FROM alpine:latest

WORKDIR /app

# Copy binary from builder
COPY --from=builder /server .
COPY --from=builder /app/configs ./configs

EXPOSE 8080

CMD ["./server"]