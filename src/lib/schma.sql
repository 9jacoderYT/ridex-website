-- ============================================
-- RIDEX Admin Panel Database Schema
-- No RLS (Using Service Role Key Security)
-- ============================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS admin_login_history CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;

-- ============================================
-- 1. ADMIN ROLES TABLE
-- ============================================
CREATE TABLE admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name VARCHAR(100) UNIQUE NOT NULL,
  role_description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles with permissions
INSERT INTO admin_roles (role_name, role_description, permissions) VALUES
('Super Admin', 'Full access to all system modules and settings', 
  '["users:all", "orders:all", "wallet:all", "pulse:all", "riders:all", "reports:all", "disputes:all", "settings:all"]'::jsonb),

('Customer Care', 'Manage customer orders, view payments, handle complaints', 
  '["orders:read", "orders:update", "wallet:read", "disputes:all", "customers:all"]'::jsonb),

('HR Officer', 'Manage rider and staff onboarding, verification, records', 
  '["riders:all", "staff:all", "users:read"]'::jsonb),

('Finance Officer', 'Manage wallets, withdrawals, financial reports', 
  '["wallet:all", "reports:finance", "withdrawals:all", "orders:read"]'::jsonb),

('Operations Officer', 'Manage deliveries, rider assignments, operations', 
  '["orders:all", "riders:read", "riders:update", "reports:operations", "disputes:read"]'::jsonb);

-- ============================================
-- 2. ADMIN USERS TABLE
-- ============================================
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role_name VARCHAR(100) NOT NULL REFERENCES admin_roles(role_name) ON UPDATE CASCADE,
  role_description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role_name);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- ============================================
-- 3. ADMIN LOGIN HISTORY TABLE
-- ============================================
CREATE TABLE admin_login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT
);

-- Create indexes
CREATE INDEX idx_login_history_user ON admin_login_history(admin_user_id);
CREATE INDEX idx_login_history_time ON admin_login_history(login_time DESC);
CREATE INDEX idx_login_history_success ON admin_login_history(success);

-- ============================================
-- 4. INSERT DEFAULT SUPER ADMIN
-- ============================================
-- Password: admin (hashed with bcrypt, salt rounds: 10)
-- IMPORTANT: Change this password immediately in production!
INSERT INTO admin_users (
  username, 
  password_hash, 
  email, 
  full_name, 
  role_name, 
  role_description,
  is_active
) VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin@ridex.ng',
  'System Administrator',
  'Super Admin',
  'Full access to all system modules',
  true
);

-- ============================================
-- 5. TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at 
BEFORE UPDATE ON admin_users
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_roles
CREATE TRIGGER update_admin_roles_updated_at 
BEFORE UPDATE ON admin_roles
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. HELPFUL VIEWS (Optional)
-- ============================================

-- View for active admins with their role info
CREATE OR REPLACE VIEW active_admin_users AS
SELECT 
  au.id,
  au.username,
  au.email,
  au.full_name,
  au.role_name,
  ar.role_description,
  ar.permissions,
  au.last_login_time,
  au.created_at
FROM admin_users au
JOIN admin_roles ar ON au.role_name = ar.role_name
WHERE au.is_active = true;

-- View for recent login activity
CREATE OR REPLACE VIEW recent_login_activity AS
SELECT 
  alh.id,
  au.username,
  au.full_name,
  au.role_name,
  alh.login_time,
  alh.success,
  alh.failure_reason,
  alh.ip_address
FROM admin_login_history alh
JOIN admin_users au ON alh.admin_user_id = au.id
ORDER BY alh.login_time DESC
LIMIT 100;

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE admin_roles IS 'Defines available admin roles and their permissions';
COMMENT ON TABLE admin_users IS 'Stores admin users with role-based access (no RLS)';
COMMENT ON TABLE admin_login_history IS 'Audit trail for all admin login attempts';
COMMENT ON VIEW active_admin_users IS 'Quick view of active admin users with role details';
COMMENT ON VIEW recent_login_activity IS 'Recent 100 login attempts for monitoring';

-- ============================================
-- 8. GRANT PERMISSIONS (if needed)
-- ============================================
-- These are handled by Supabase service role key
-- No additional grants needed

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Default Admin Credentials:
-- Username: admin
-- Password: admin
-- Email: admin@ridex.ng
-- 
-- SECURITY NOTES:
-- 1. RLS is DISABLED - security handled by server actions
-- 2. Always use SUPABASE_SERVICE_ROLE_KEY on server
-- 3. Never expose service role key to client
-- 4. Change default admin password immediately
-- 5. All passwords are hashed with bcrypt (salt rounds: 10)
-- ============================================