import { query } from '../db';

export interface MCPServer {
  id: number;
  name: string;
  description: string;
  command: string;
  script_path: string;
  args: string[];
  env_vars: Record<string, string>;
  is_enabled: boolean;
  is_default: boolean;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMCPServerInput {
  name: string;
  description?: string;
  command: string;
  script_path: string;
  args?: string[];
  env_vars?: Record<string, string>;
  is_enabled?: boolean;
  timeout_seconds?: number;
}

export interface UpdateMCPServerInput {
  name?: string;
  description?: string;
  command?: string;
  script_path?: string;
  args?: string[];
  env_vars?: Record<string, string>;
  is_enabled?: boolean;
  is_default?: boolean;
  timeout_seconds?: number;
}

export interface MCPServerListItem {
  id: number;
  name: string;
  description: string;
  command: string;
  scriptPath: string;
  args: string[];
  isDefault: boolean;
  timeoutSeconds: number;
}

export interface MCPServersResponse {
  enabled: boolean;
  servers: MCPServerListItem[];
  defaultServer: MCPServerListItem | null;
}

export class MCPRepository {
  /**
   * 获取所有 MCP 服务器（管理员）
   */
  async getAll(): Promise<MCPServer[]> {
    const result = await query(
      `SELECT id, name, description, command, script_path, args, env_vars,
              is_enabled, is_default, timeout_seconds, created_at, updated_at
       FROM mcp_servers
       ORDER BY is_default DESC, is_enabled DESC, name ASC`
    );

    return result.rows.map(row => this.parseRow(row));
  }

  /**
   * 获取启用的 MCP 服务器列表（公开）
   */
  async getEnabledList(): Promise<MCPServersResponse> {
    // 检查 MCP 是否启用
    const mcpEnabledResult = await query(
      "SELECT value FROM settings WHERE key = 'mcp_enabled'"
    );
    const enabled = mcpEnabledResult.rows[0]?.value === 'true';

    if (!enabled) {
      return {
        enabled: false,
        servers: [],
        defaultServer: null,
      };
    }

    const result = await query(
      `SELECT id, name, description, command, script_path, args, is_default, timeout_seconds
       FROM mcp_servers
       WHERE is_enabled = true
       ORDER BY is_default DESC, name ASC`
    );

    const servers: MCPServerListItem[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      command: row.command,
      scriptPath: row.script_path,
      args: Array.isArray(row.args) ? row.args : JSON.parse(row.args || '[]'),
      isDefault: row.is_default,
      timeoutSeconds: row.timeout_seconds,
    }));

    const defaultServer = servers.find(s => s.isDefault) || servers[0] || null;

    return {
      enabled: true,
      servers,
      defaultServer,
    };
  }

  /**
   * 根据 ID 获取 MCP 服务器
   */
  async getById(id: number): Promise<MCPServer | null> {
    const result = await query(
      `SELECT id, name, description, command, script_path, args, env_vars,
              is_enabled, is_default, timeout_seconds, created_at, updated_at
       FROM mcp_servers WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    return this.parseRow(result.rows[0]);
  }

  /**
   * 创建 MCP 服务器
   */
  async create(data: CreateMCPServerInput): Promise<MCPServer> {
    const result = await query(
      `INSERT INTO mcp_servers (name, description, command, script_path, args, env_vars, is_enabled, is_default, timeout_seconds)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, false, $8)
       RETURNING id, name, description, command, script_path, args, env_vars,
                 is_enabled, is_default, timeout_seconds, created_at, updated_at`,
      [
        data.name,
        data.description || '',
        data.command,
        data.script_path,
        JSON.stringify(data.args || []),
        JSON.stringify(data.env_vars || {}),
        data.is_enabled ?? true,
        data.timeout_seconds || 30,
      ]
    );

    return this.parseRow(result.rows[0]);
  }

  /**
   * 更新 MCP 服务器
   */
  async update(id: number, data: UpdateMCPServerInput): Promise<MCPServer | null> {
    const result = await query(
      `UPDATE mcp_servers SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         command = COALESCE($3, command),
         script_path = COALESCE($4, script_path),
         args = COALESCE($5::jsonb, args),
         env_vars = COALESCE($6::jsonb, env_vars),
         is_enabled = COALESCE($7, is_enabled),
         is_default = COALESCE($8, is_default),
         timeout_seconds = COALESCE($9, timeout_seconds)
       WHERE id = $10
       RETURNING id, name, description, command, script_path, args, env_vars,
                 is_enabled, is_default, timeout_seconds, created_at, updated_at`,
      [
        data.name,
        data.description,
        data.command,
        data.script_path,
        data.args ? JSON.stringify(data.args) : null,
        data.env_vars ? JSON.stringify(data.env_vars) : null,
        data.is_enabled,
        data.is_default,
        data.timeout_seconds,
        id,
      ]
    );

    if (result.rows.length === 0) return null;

    return this.parseRow(result.rows[0]);
  }

  /**
   * 删除 MCP 服务器
   */
  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM mcp_servers WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  /**
   * 设置默认 MCP 服务器
   */
  async setDefault(id: number): Promise<boolean> {
    await query('UPDATE mcp_servers SET is_default = false');
    const result = await query(
      'UPDATE mcp_servers SET is_default = true WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  /**
   * 检查 MCP 功能是否启用
   */
  async isMCPEnabled(): Promise<boolean> {
    const result = await query(
      "SELECT value FROM settings WHERE key = 'mcp_enabled'"
    );
    return result.rows[0]?.value === 'true';
  }

  /**
   * 获取 MCP 设置
   */
  async getMCPSettings(): Promise<{
    enabled: boolean;
    allowUserSelect: boolean;
    defaultServerId: string;
  }> {
    const result = await query(
      "SELECT key, value FROM settings WHERE key LIKE 'mcp_%'"
    );

    const settings: Record<string, string> = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return {
      enabled: settings['mcp_enabled'] === 'true',
      allowUserSelect: settings['mcp_allow_user_select'] !== 'false',
      defaultServerId: settings['mcp_default_server_id'] || '',
    };
  }

  private parseRow(row: any): MCPServer {
    return {
      ...row,
      args: Array.isArray(row.args) ? row.args : JSON.parse(row.args || '[]'),
      env_vars: typeof row.env_vars === 'object' ? row.env_vars : JSON.parse(row.env_vars || '{}'),
    };
  }
}

// 导出单例实例
export const mcpRepository = new MCPRepository();
