-- Migration: Add MCP servers table and settings
-- Run this migration to add MCP server configuration support

-- MCP servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  transport VARCHAR(20) DEFAULT 'stdio' CHECK (transport IN ('stdio', 'sse', 'http')),
  command VARCHAR(50) CHECK (command IN ('npx', 'node', 'python', 'uvx', 'docker', 'custom')),
  script_path VARCHAR(500),
  args JSONB DEFAULT '[]'::jsonb,
  env_vars JSONB DEFAULT '{}'::jsonb,
  url VARCHAR(1000),
  headers JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to existing table (if table already exists)
ALTER TABLE mcp_servers
  ADD COLUMN IF NOT EXISTS transport VARCHAR(20) DEFAULT 'stdio' CHECK (transport IN ('stdio', 'sse', 'http')),
  ADD COLUMN IF NOT EXISTS url VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS headers JSONB DEFAULT '{}'::jsonb;

-- Modify constraints for command and script_path based on transport type
ALTER TABLE mcp_servers
  ALTER COLUMN command DROP NOT NULL,
  ALTER COLUMN script_path DROP NOT NULL;

-- Create index for enabled servers
CREATE INDEX IF NOT EXISTS idx_mcp_servers_enabled ON mcp_servers(is_enabled);

-- Create trigger for updated_at
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

-- Insert sample MCP servers
INSERT INTO mcp_servers (name, description, command, script_path, args, is_enabled, is_default) VALUES
  ('filesystem', '文件系统访问工具', 'npx', '@modelcontextprotocol/server-filesystem', '["."]', true, false),
  ('github', 'GitHub API 工具', 'npx', '@modelcontextprotocol/server-github', '[]', true, false),
  ('postgres', 'PostgreSQL 数据库工具', 'npx', '@modelcontextprotocol/server-postgres', '[]', true, false),
  ('fetch', 'HTTP 请求工具', 'npx', '@modelcontextprotocol/server-fetch', '[]', true, true)
ON CONFLICT DO NOTHING;

-- Add MCP-related settings
INSERT INTO settings (key, value, type, description) VALUES
  ('mcp_enabled', 'false', 'boolean', '是否启用 MCP 功能'),
  ('mcp_default_server_id', '', 'string', '默认 MCP 服务器 ID'),
  ('mcp_allow_user_select', 'true', 'boolean', '允许用户选择 MCP 服务器')
ON CONFLICT (key) DO NOTHING;
