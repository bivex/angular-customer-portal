-- Phase 1: Foundation - Audit Events Table
-- Migration: 0005_add_audit_events_table.sql
-- Date: 2025-12-22

-- Create audit_events table for comprehensive security event logging
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'user_login', 'user_logout', 'user_register', 'password_change',
    'token_refresh', 'token_revoked', 'session_created', 'session_revoked',
    'permission_denied', 'step_up_required', 'step_up_completed',
    'suspicious_activity', 'account_locked', 'account_unlocked'
  )),
  event_severity TEXT NOT NULL DEFAULT 'info' CHECK (event_severity IN ('info', 'warning', 'error', 'critical')),
  ip_address INET,
  user_agent TEXT,
  resource TEXT,
  action TEXT,
  result TEXT CHECK (result IN ('success', 'failure', 'denied')),
  metadata JSONB,
  risk_indicators JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance and querying
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_session_id ON audit_events(session_id);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_event_severity ON audit_events(event_severity);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_audit_events_result ON audit_events(result);

-- Composite indexes for common queries
CREATE INDEX idx_audit_events_user_type ON audit_events(user_id, event_type);
CREATE INDEX idx_audit_events_user_severity ON audit_events(user_id, event_severity);
CREATE INDEX idx_audit_events_recent_warnings ON audit_events(created_at DESC, event_severity) WHERE event_severity IN ('warning', 'error', 'critical');