-- ============================================================
-- T-REX / SafePin
-- PostgreSQL Database Schema
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,

    name VARCHAR(100) NOT NULL DEFAULT 'Verified Requester',

    email VARCHAR(255) NOT NULL DEFAULT '',

    phone VARCHAR(30) NOT NULL UNIQUE,

    aadhaar_last4 CHAR(4),

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    role VARCHAR(30) NOT NULL DEFAULT 'requester',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- OTP / VERIFICATION SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS verification_sessions (
    id VARCHAR(150) PRIMARY KEY,

    user_id VARCHAR(100),

    phone VARCHAR(30) NOT NULL,

    provider VARCHAR(50) NOT NULL DEFAULT '2factor',

    channel VARCHAR(20) NOT NULL DEFAULT 'sms',

    provider_session_id VARCHAR(255),

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    used_at TIMESTAMPTZ,

    CONSTRAINT fk_verification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_phone
    ON verification_sessions(phone);

CREATE INDEX IF NOT EXISTS idx_verification_expires
    ON verification_sessions(expires_at);

-- ============================================================
-- CASES
-- ============================================================

CREATE TABLE IF NOT EXISTS cases (
    case_id VARCHAR(50) PRIMARY KEY,

    user_id VARCHAR(100) NOT NULL,

    document_name VARCHAR(255) NOT NULL,

    action VARCHAR(50) NOT NULL,

    reason TEXT NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'UNDER_VERIFICATION',

    status_label VARCHAR(100) NOT NULL DEFAULT 'Under Verification',

    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cases_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cases_user
    ON cases(user_id);

CREATE INDEX IF NOT EXISTS idx_cases_status
    ON cases(status);

CREATE INDEX IF NOT EXISTS idx_cases_created
    ON cases(created_at DESC);

-- ============================================================
-- SERVICE REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS service_requests (
    request_id VARCHAR(150) PRIMARY KEY,

    case_id VARCHAR(50) NOT NULL,

    user_id VARCHAR(100) NOT NULL,

    service VARCHAR(255) NOT NULL,

    action VARCHAR(50) NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'UNDER_VERIFICATION',

    status_label VARCHAR(100) NOT NULL DEFAULT 'Under Verification',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_requests_case
        FOREIGN KEY (case_id)
        REFERENCES cases(case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_requests_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_requests_case
    ON service_requests(case_id);

CREATE INDEX IF NOT EXISTS idx_requests_user
    ON service_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_requests_status
    ON service_requests(status);

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(150) PRIMARY KEY,

    case_id VARCHAR(50) NOT NULL,

    user_id VARCHAR(100) NOT NULL,

    original_name VARCHAR(255) NOT NULL,

    filename VARCHAR(255) NOT NULL,

    mime_type VARCHAR(100) NOT NULL,

    size BIGINT NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED',

    status_label VARCHAR(100) NOT NULL DEFAULT 'Uploaded',

    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_documents_case
        FOREIGN KEY (case_id)
        REFERENCES cases(case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_documents_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_case
    ON documents(case_id);

CREATE INDEX IF NOT EXISTS idx_documents_user
    ON documents(user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(150) PRIMARY KEY,

    user_id VARCHAR(100) NOT NULL,

    type VARCHAR(50) NOT NULL,

    icon VARCHAR(20),

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    case_id VARCHAR(50),

    priority VARCHAR(30) NOT NULL DEFAULT 'normal',

    read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_case
        FOREIGN KEY (case_id)
        REFERENCES cases(case_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created
    ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications(user_id, read);

-- ============================================================
-- SECURITY / EMERGENCY PROTECTION
-- ============================================================

CREATE TABLE IF NOT EXISTS security_protections (
    user_id VARCHAR(100) PRIMARY KEY,

    active BOOLEAN NOT NULL DEFAULT FALSE,

    activated_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_security_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(150) PRIMARY KEY,

    user_id VARCHAR(100),

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id VARCHAR(150),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user
    ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_entity
    ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_created
    ON audit_logs(created_at DESC);

-- ============================================================
-- FINISHED
-- ============================================================