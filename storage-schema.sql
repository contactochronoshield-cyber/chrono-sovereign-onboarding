-- Chrono Storage — Metadata DB
CREATE TABLE IF NOT EXISTS storage_objects (
    file_id             TEXT PRIMARY KEY,
    organization_id     TEXT NOT NULL,
    user_id             TEXT NOT NULL,
    bucket              TEXT NOT NULL,
    path                TEXT NOT NULL,
    filename            TEXT NOT NULL,
    size_bytes          INTEGER NOT NULL,
    hash_sha256         TEXT NOT NULL,
    mime_type           TEXT,
    version             INTEGER NOT NULL DEFAULT 1,
    encryption_status   TEXT NOT NULL DEFAULT 'pending'
                         CHECK (encryption_status IN ('pending','encrypted','none')),
    permissions         TEXT NOT NULL DEFAULT 'private'
                         CHECK (permissions IN ('private','org','public')),
    storage_node        TEXT NOT NULL,
    replication_status  TEXT NOT NULL DEFAULT 'single'
                         CHECK (replication_status IN ('single','replicating','replicated')),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    modified_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_storage_org ON storage_objects (organization_id);
CREATE INDEX IF NOT EXISTS idx_storage_hash ON storage_objects (hash_sha256);

CREATE TABLE IF NOT EXISTS storage_object_versions (
    version_id      TEXT PRIMARY KEY,
    file_id         TEXT NOT NULL REFERENCES storage_objects(file_id),
    version         INTEGER NOT NULL,
    hash_sha256     TEXT NOT NULL,
    size_bytes      INTEGER NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_versions_file ON storage_object_versions (file_id);
