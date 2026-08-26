-- Migration: Add MCP servers table and settings (incremental)

CREATE TABLE IF NOT EXISTS mcp_servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  transport VARCHAR(20) DEFAULT 'stdio',
  command VARCHAR(50),
  script_path VARCHAR(500),
  args JSONB DEFAULT '[]'::jsonb,
  env_vars JSONB DEFAULT '{}'::jsonb,
  url VARCHAR(1000),
  headers JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS transport VARCHAR(20) DEFAULT 'stdio';
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS command VARCHAR(50);
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS script_path VARCHAR(500);
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS args JSONB DEFAULT '[]'::jsonb;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS env_vars JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS url VARCHAR(1000);
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS headers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS timeout_seconds INTEGER DEFAULT 30;

CREATE INDEX IF NOT EXISTS idx_mcp_servers_enabled ON mcp_servers(is_enabled);

CREATE OR REPLACE FUNCTION update_mcp_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_mcp_servers_updated_at ON mcp_servers;
CREATE TRIGGER update_mcp_servers_updated_at
  BEFORE UPDATE ON mcp_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_mcp_servers_updated_at();

INSERT INTO settings (key, value, type, description) VALUES
  ('mcp_enabled', 'false', 'boolean', '是否启用 MCP 功能'),
  ('mcp_default_server_id', '', 'string', '默认 MCP 服务器 ID'),
  ('mcp_allow_user_select', 'true', 'boolean', '允许用户选择 MCP 服务器')
ON CONFLICT (key) DO NOTHING;
