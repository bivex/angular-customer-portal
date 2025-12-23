-- Insert default system roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('user', 'Basic authenticated user with standard access', true),
  ('premium', 'Premium tier user with enhanced access and features', true),
  ('admin', 'Administrative user with full system access', true)
ON CONFLICT (name) DO NOTHING;
