-- Phase 1: Foundation - Sessions Table
-- Migration: 0004_add_sessions_table.sql
-- Date: 2025-12-22

-- Create sessions table for tracking active user sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token_jti TEXT, -- Made nullable for initial creation
  refresh_token_jti TEXT, -- Made nullable for initial creation
  ip_address INET,
  ip_hash TEXT,
  user_agent TEXT,
  user_agent_hash TEXT,
  device_fingerprint TEXT,
  geolocation JSONB,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_access_token_jti ON sessions(access_token_jti) WHERE access_token_jti IS NOT NULL;
CREATE INDEX idx_sessions_refresh_token_jti ON sessions(refresh_token_jti) WHERE refresh_token_jti IS NOT NULL;
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity_at ON sessions(last_activity_at);

-- Unique constraint for active access token JTIs (nulls not distinct)
ALTER TABLE sessions ADD CONSTRAINT unique_active_access_jti
  EXCLUDE (access_token_jti WITH =) WHERE (is_active = true AND access_token_jti IS NOT NULL);

-- Unique constraint for active refresh token JTIs
ALTER TABLE sessions ADD CONSTRAINT unique_active_refresh_jti
  EXCLUDE (refresh_token_jti WITH =) WHERE (is_active = true AND refresh_token_jti IS NOT NULL);