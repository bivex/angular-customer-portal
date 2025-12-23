-- Phase 1: Foundation - Update Users Table
-- Migration: 0007_update_users_table.sql
-- Date: 2025-12-22

-- Add security-related columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS security_level INTEGER NOT NULL DEFAULT 1 CHECK (security_level >= 1 AND security_level <= 5),
ADD COLUMN IF NOT EXISTS require_step_up BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[], -- Array of backup codes
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS account_locked BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this timestamp (for brute force protection)';
COMMENT ON COLUMN users.security_level IS 'Current security level (1-5): 1=basic, 2=recent login, 3=password re-confirm, 4=MFA, 5=biometric+MFA';
COMMENT ON COLUMN users.require_step_up IS 'Whether user requires step-up authentication for sensitive operations';
COMMENT ON COLUMN users.mfa_enabled IS 'Whether multi-factor authentication is enabled';
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret for MFA';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Backup recovery codes for MFA';
COMMENT ON COLUMN users.password_changed_at IS 'When password was last changed';
COMMENT ON COLUMN users.account_locked IS 'Whether account is manually locked by admin';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_security_level ON users(security_level);
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked);
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts);

-- Add constraint to ensure failed_login_attempts doesn't go negative
ALTER TABLE users ADD CONSTRAINT failed_login_attempts_non_negative
  CHECK (failed_login_attempts >= 0);

-- Update existing users to have basic security level and password_changed_at
UPDATE users
SET
  security_level = 1,
  password_changed_at = created_at,
  require_step_up = false,
  mfa_enabled = false,
  account_locked = false
WHERE security_level IS NULL OR password_changed_at IS NULL;