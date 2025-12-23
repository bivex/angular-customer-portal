-- Phase 1: Foundation - RBAC/ABAC Tables
-- Migration: 0006_add_rbac_abac_tables.sql
-- Date: 2025-12-22

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  conditions JSONB, -- For ABAC conditions
  is_system_permission BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_attributes table for ABAC
CREATE TABLE IF NOT EXISTS user_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, attribute_key)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Indexes
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_name ON permissions(name);

CREATE INDEX idx_user_attributes_user_id ON user_attributes(user_id);
CREATE INDEX idx_user_attributes_key ON user_attributes(attribute_key);
CREATE INDEX idx_user_attributes_key_value ON user_attributes(attribute_key, attribute_value);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description, is_system_permission) VALUES
  ('user:read:self', 'user', 'read', 'Read own user profile', true),
  ('user:update:self', 'user', 'update', 'Update own user profile', true),
  ('user:delete:self', 'user', 'delete', 'Delete own account', true),
  ('user:change_password', 'user', 'change_password', 'Change own password', true),

  ('license:read', 'license', 'read', 'Read license information', true),
  ('license:create', 'license', 'create', 'Create new licenses', true),
  ('license:update', 'license', 'update', 'Update license information', true),
  ('license:delete', 'license', 'delete', 'Delete licenses (admin only)', true),

  ('admin:users', 'admin', 'users', 'Manage all users', true),
  ('admin:licenses', 'admin', 'licenses', 'Manage all licenses', true),
  ('admin:system', 'admin', 'system', 'Full system administration', true)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE
  (r.name = 'user' AND p.name IN ('user:read:self', 'user:update:self', 'user:change_password', 'license:read')) OR
  (r.name = 'premium' AND p.name IN ('user:read:self', 'user:update:self', 'user:change_password', 'license:read', 'license:create', 'license:update')) OR
  (r.name = 'admin' AND p.name IN ('user:read:self', 'user:update:self', 'user:change_password', 'license:read', 'license:create', 'license:update', 'license:delete', 'admin:users', 'admin:licenses', 'admin:system'))
ON CONFLICT (role_id, permission_id) DO NOTHING;