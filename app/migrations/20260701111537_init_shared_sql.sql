-- +goose Up
SELECT 'up SQL query';
-- +goose StatementBegin

CREATE TYPE media_status AS ENUM ('pending', 'attached', 'failed');

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- S3 Storage Identifiers
    bucket VARCHAR(100) NOT NULL,
    storage_key VARCHAR(500) NOT NULL UNIQUE, -- e.g., "articles/2026/07/uuid.jpg"
    filename VARCHAR(255) NOT NULL,

    -- Status & Lifecycle Management
    status media_status NOT NULL DEFAULT 'pending',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,

    type VARCHAR(50),
    meta JSONB,
    source VARCHAR(255),

    -- Self-referencing Foreign Key for Thumbnails
    thumbnail_id UUID REFERENCES media(id) ON DELETE SET NULL,

    -- Audit Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Querying
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_media_storage_key ON media(storage_key);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_thumbnail_id ON media(thumbnail_id) WHERE thumbnail_id IS NOT NULL;

-- +goose StatementEnd

-- +goose Down
SELECT 'down SQL query';
-- +goose StatementBegin

DROP TABLE IF EXISTS media;

-- +goose StatementEnd
