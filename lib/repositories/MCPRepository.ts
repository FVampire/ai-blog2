import { BaseRepository } from "./BaseRepository";
import { MCPServer } from "../entities/MCPServer";
import { Setting } from "../entities/Setting";

export type MCPTransportType = "stdio" | "sse" | "http";

export interface CreateMCPServerInput {
  name: string;
  description?: string;
  transport?: MCPTransportType;
  command?: string;
  script_path?: string;
  args?: string[];
  env_vars?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  is_enabled?: boolean;
  timeout_seconds?: number;
}

export interface UpdateMCPServerInput {
  name?: string;
  description?: string;
  transport?: MCPTransportType;
  command?: string;
  script_path?: string;
  args?: string[];
  env_vars?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  is_enabled?: boolean;
  is_default?: boolean;
  timeout_seconds?: number;
}

export interface MCPServerListItem {
  id: number;
  name: string;
  description: string;
  command?: string;
  scriptPath: string;
  args?: string[];
  transport?: MCPTransportType;
  url?: string;
  headers?: Record<string, string>;
  isDefault: boolean;
  timeoutSeconds: number;
  envVars?: Record<string, string>;
}

export interface MCPServersResponse {
  enabled: boolean;
  servers: MCPServerListItem[];
  defaultServer: MCPServerListItem | null;
}

function entityToListItem(s: MCPServer): MCPServerListItem {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    command: s.command,
    scriptPath: s.scriptPath ?? "",
    args: s.args,
    transport: s.transport,
    url: s.url,
    headers: s.headers,
    isDefault: s.isDefault,
    timeoutSeconds: s.timeoutSeconds,
    envVars: s.envVars,
  };
}

export class MCPRepository extends BaseRepository {
  /**
   * 获取所有 MCP 服务器（管理员）
   */
  async getAll() {
    const repo = await (this.constructor as typeof BaseRepository)["getRepo"](
      MCPServer,
    );
    return repo.find({
      order: { isDefault: "DESC", isEnabled: "DESC", name: "ASC" },
    });
  }

  /**
   * 获取执行配置（仅服务端使用，禁止直接作为公开接口响应）
   */
  async getEnabledList(): Promise<MCPServersResponse> {
    const ds = await (this.constructor as typeof BaseRepository)[
      "getDataSource"
    ]();
    const settingRepo = ds.getRepository(Setting);
    const mcpEnabled = await settingRepo.findOne({
      where: { key: "mcp_enabled" },
    });
    const enabled = mcpEnabled?.value === "true";

    if (!enabled) {
      return { enabled: false, servers: [], defaultServer: null };
    }

    const repo = ds.getRepository(MCPServer);
    const servers = await repo.find({
      where: { isEnabled: true },
      order: { isDefault: "DESC", name: "ASC" },
    });

    const list = servers.map(entityToListItem);
    const defaultServer =
      list.find((s: MCPServerListItem) => s.isDefault) || list[0] || null;

    return { enabled: true, servers: list, defaultServer };
  }

  /**
   * 根据 ID 获取 MCP 服务器
   */
  async getById(id: number): Promise<MCPServer | null> {
    const ds = await (this.constructor as typeof BaseRepository)[
      "getDataSource"
    ]();
    const repo = ds.getRepository(MCPServer);
    return (await repo.findOne({ where: { id } })) ?? null;
  }

  /**
   * 创建 MCP 服务器
   */
  async create(data: CreateMCPServerInput): Promise<MCPServer> {
    const ds = await (this.constructor as typeof BaseRepository)[
      "getDataSource"
    ]();
    const repo = ds.getRepository(MCPServer);
    const server = repo.create({
      name: data.name,
      description: data.description ?? "",
      transport: data.transport ?? "stdio",
      command: data.command ?? "",
      scriptPath: data.script_path ?? "",
      args: data.args ?? [],
      envVars: data.env_vars ?? {},
      url: data.url ?? "",
      headers: data.headers ?? {},
      isEnabled: data.is_enabled ?? true,
      isDefault: false,
      timeoutSeconds: data.timeout_seconds ?? 30,
    });

    return (await repo.save(server)) as MCPServer;
  }

  /**
   * 更新 MCP 服务器
   */
  async update(
    id: number,
    data: UpdateMCPServerInput,
  ): Promise<MCPServer | null> {
    const ds = await (this.constructor as typeof BaseRepository)[
      "getDataSource"
    ]();
    const repo = ds.getRepository(MCPServer);
    const server = await repo.findOne({ where: { id } });
    if (!server) return null;

    if (data.name !== undefined) server.name = data.name;
    if (data.description !== undefined) server.description = data.description;
    if (data.transport !== undefined) server.transport = data.transport;
    if (data.command !== undefined) server.command = data.command;
    if (data.script_path !== undefined) server.scriptPath = data.script_path;
    if (data.args !== undefined) server.args = data.args;
    if (data.env_vars !== undefined) server.envVars = data.env_vars;
    if (data.url !== undefined) server.url = data.url;
    if (data.headers !== undefined) server.headers = data.headers;
    if (data.is_enabled !== undefined) server.isEnabled = data.is_enabled;
    if (data.is_default !== undefined) server.isDefault = data.is_default;
    if (data.timeout_seconds !== undefined)
      server.timeoutSeconds = data.timeout_seconds;

    return (await repo.save(server)) as MCPServer;
  }

  /**
   * 删除 MCP 服务器
   */
  async delete(id: number): Promise<boolean> {
    const ds = await (this.constructor as typeof BaseRepository)[
      "getDataSource"
    ]();
    const repo = ds.getRepository(MCPServer);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * 设置默认 MCP 服务器
   */
  async setDefault(id: number): Promise<boolean> {
    const ds = await (this.constructor as typeof BaseRepository)[
      "getDataSource"
    ]();
    const repo = ds.getRepository(MCPServer);
    return ds.transaction(async (manager) => {
      const target = await manager.findOne(MCPServer, { where: { id } });
      if (!target) return false;
      await manager
        .createQueryBuilder()
        .update(MCPServer)
        .set({ isDefault: false })
        .execute();
      await manager.update(MCPServer, id, { isDefault: true });
      return true;
    });
  }

  /**
   * 检查 MCP 功能是否启用
   */
  async isMCPEnabled(): Promise<boolean> {
    const ds = await (this.constructor as typeof BaseRepository)[
      "getDataSource"
    ]();
    const setting = await ds
      .getRepository(Setting)
      .findOne({ where: { key: "mcp_enabled" } });
    return setting?.value === "true";
  }

  /**
   * 获取 MCP 设置
   */
  async getMCPSettings(): Promise<{
    enabled: boolean;
    allowUserSelect: boolean;
    defaultServerId: string;
  }> {
    const ds = await (this.constructor as typeof BaseRepository)[
      "getDataSource"
    ]();
    const repo = ds.getRepository(Setting);
    const qb = repo
      .createQueryBuilder("s")
      .where("s.key LIKE :prefix", { prefix: "mcp_%" });
    const settings = await qb.getMany();

    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value ?? "";
    });

    return {
      enabled: map["mcp_enabled"] === "true",
      allowUserSelect: map["mcp_allow_user_select"] !== "false",
      defaultServerId: map["mcp_default_server_id"] || "",
    };
  }
}

// 导出单例实例
export const mcpRepository = new MCPRepository();
