-- Phase 4: ABAC - Assign default roles to existing users
-- Migration: 0008_assign_default_roles.sql
-- Date: 2025-12-22

-- Assign 'user' role to all existing users who don't have roles
INSERT INTO user_roles (user_id, role_id, granted_at, is_active)
SELECT
  u.id as user_id,
  r.id as role_id,
  NOW() as granted_at,
  true as is_active
FROM users u
CROSS JOIN roles r
WHERE r.name = 'user'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = u.id AND ur.role_id = r.id
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign 'admin' role to first user (assuming it's the system admin)
-- In production, this should be done through proper admin interface
INSERT INTO user_roles (user_id, role_id, granted_at, is_active)
SELECT
  u.id as user_id,
  r.id as role_id,
  NOW() as granted_at,
  true as is_active
FROM users u
CROSS JOIN roles r
WHERE r.name = 'admin'
AND u.id = (SELECT MIN(id) FROM users)
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = u.id AND ur.role_id = r.id
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Add some example user attributes for ABAC testing
INSERT INTO user_attributes (user_id, attribute_key, attribute_value) VALUES
  ((SELECT MIN(id) FROM users), 'department', 'engineering'),
  ((SELECT MIN(id) FROM users), 'level', 'senior'),
  ((SELECT MIN(id) FROM users), 'clearance', 'confidential')
ON CONFLICT (user_id, attribute_key) DO NOTHING;

-- Add attributes for other users
INSERT INTO user_attributes (user_id, attribute_key, attribute_value)
SELECT
  u.id,
  'department',
  CASE
    WHEN u.id % 3 = 0 THEN 'sales'
    WHEN u.id % 3 = 1 THEN 'marketing'
    ELSE 'engineering'
  END
FROM users u
WHERE u.id > (SELECT MIN(id) FROM users)
ON CONFLICT (user_id, attribute_key) DO NOTHING;

INSERT INTO user_attributes (user_id, attribute_key, attribute_value)
SELECT
  u.id,
  'level',
  CASE
    WHEN u.id % 4 = 0 THEN 'junior'
    WHEN u.id % 4 = 1 THEN 'mid'
    WHEN u.id % 4 = 2 THEN 'senior'
    ELSE 'lead'
  END
FROM users u
ON CONFLICT (user_id, attribute_key) DO NOTHING;