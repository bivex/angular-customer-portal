-- Phase 4: Enterprise Hardening - ABAC DSL Storage
-- Migration: 0010_abac_dsl_storage.sql
-- Date: 2025-12-22

-- ABAC Conditions DSL Tables (structured storage instead of JSON blobs)

-- Condition types enum
CREATE TYPE condition_type AS ENUM (
  'time_window',
  'ip_range',
  'risk_score',
  'user_attribute',
  'geolocation',
  'device_fingerprint',
  'security_level'
);

-- Operator types for conditions
CREATE TYPE condition_operator AS ENUM (
  '=', '!=', '>', '<', '>=', '<=',
  'in', 'not_in', 'contains', 'not_contains',
  'between', 'regex_match'
);

-- ABAC conditions table (structured DSL)
CREATE TABLE abac_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  condition_type condition_type NOT NULL,
  condition_key TEXT, -- e.g., 'department', 'riskScore', 'country'
  operator condition_operator NOT NULL,
  value_text TEXT, -- For string values
  value_number DECIMAL, -- For numeric values
  value_jsonb JSONB, -- For complex values (arrays, objects)

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_abac_conditions_permission_id ON abac_conditions(permission_id);
CREATE INDEX idx_abac_conditions_type ON abac_conditions(condition_type);
CREATE INDEX idx_abac_conditions_key ON abac_conditions(condition_key) WHERE condition_key IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_abac_conditions_type_key ON abac_conditions(condition_type, condition_key);

-- Add some example structured conditions for existing permissions
-- This would be populated by the application, not migration
-- But we can add a few examples

-- Insert example time window condition (business hours)
INSERT INTO abac_conditions (permission_id, condition_type, condition_key, operator, value_jsonb)
SELECT
  p.id,
  'time_window'::condition_type,
  'business_hours',
  'between'::condition_operator,
  '{"start": "09:00", "end": "17:00", "timezone": "UTC"}'::jsonb
FROM permissions p
WHERE p.resource = 'license' AND p.action = 'delete'
LIMIT 1;

-- Insert example IP range condition (trusted networks)
INSERT INTO abac_conditions (permission_id, condition_type, condition_key, operator, value_jsonb)
SELECT
  p.id,
  'ip_range'::condition_type,
  'trusted_networks',
  'in'::condition_operator,
  '["192.168.1.0/24", "10.0.0.0/8"]'::jsonb
FROM permissions p
WHERE p.resource = 'license' AND p.action = 'delete'
LIMIT 1;

-- Insert example risk score condition
INSERT INTO abac_conditions (permission_id, condition_type, condition_key, operator, value_number)
SELECT
  p.id,
  'risk_score'::condition_type,
  'max_risk',
  '<='::condition_operator,
  30
FROM permissions p
WHERE p.resource = 'license' AND p.action = 'delete'
LIMIT 1;

-- Insert example user attribute condition
INSERT INTO abac_conditions (permission_id, condition_type, condition_key, operator, value_text)
SELECT
  p.id,
  'user_attribute'::condition_type,
  'department',
  '='::condition_operator,
  'engineering'
FROM permissions p
WHERE p.resource = 'user' AND p.action = 'read'
LIMIT 1;

COMMENT ON TABLE abac_conditions IS 'Structured ABAC conditions DSL storage for high-performance rule evaluation';
COMMENT ON COLUMN abac_conditions.condition_type IS 'Type of condition (time_window, ip_range, etc.)';
COMMENT ON COLUMN abac_conditions.condition_key IS 'Condition parameter key (department, riskScore, etc.)';
COMMENT ON COLUMN abac_conditions.operator IS 'Comparison operator (=, >, in, etc.)';
COMMENT ON COLUMN abac_conditions.value_text IS 'String values for conditions';
COMMENT ON COLUMN abac_conditions.value_number IS 'Numeric values for conditions';
COMMENT ON COLUMN abac_conditions.value_jsonb IS 'Complex values (arrays, objects) for conditions';

