-- Phase 4: Enterprise Hardening - Audit Immutability
-- Migration: 0009_add_audit_immutability.sql
-- Date: 2025-12-22

-- Add hash chain fields for audit immutability (append-only, tamper-evident)
ALTER TABLE audit_events
ADD COLUMN IF NOT EXISTS event_hash TEXT,
ADD COLUMN IF NOT EXISTS previous_event_hash TEXT;

-- Update existing records with empty hashes (for backward compatibility)
UPDATE audit_events SET event_hash = '' WHERE event_hash IS NULL;

-- Add clock skew tolerance to JWT config (for mobile clients)
-- This is handled in application config, not DB migration

-- Update existing audit events with hashes (for migration)
-- Note: This is a simplified approach. In production, you'd want to
-- recalculate hashes for all existing events in chronological order.

-- Create index for hash chain verification
CREATE INDEX IF NOT EXISTS idx_audit_events_hash_chain ON audit_events(previous_event_hash);

-- Add comment for audit immutability
COMMENT ON TABLE audit_events IS 'Append-only audit log with hash chain for immutability and tamper detection';
COMMENT ON COLUMN audit_events.event_hash IS 'SHA256 hash of this audit event for tamper detection';
COMMENT ON COLUMN audit_events.previous_event_hash IS 'Hash of previous event in chain for immutability proof';

-- Create a separate audit database role with INSERT-only permissions (recommended for production)
-- This would be done via database role management, not in migration