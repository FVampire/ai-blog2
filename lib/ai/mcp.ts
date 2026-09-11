import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { mcpRepository } from "../repositories/MCPRepository";
import { publicTools } from "./config";
import type { MCPServerListItem } from "../repositories/MCPRepository";
import { abortable, isReadOnlyTool } from "./abort";

export function createMCPClient(server: MCPServerListItem) {
  const common = {
    defaultToolTimeout:
      Math.min(60, Math.max(1, server.timeoutSeconds || 30)) * 1000,
  };
  const connection =
    server.transport === "stdio"
      ? {
          ...common,
          transport: "stdio" as const,
          command: server.command || "",
          args: [server.scriptPath, ...(server.args || [])].filter(Boolean),
          env: server.envVars || {},
          stderr: "ignore" as const,
        }
      : {
          ...common,
          transport:
            server.transport === "sse" ? ("sse" as const) : ("http" as const),
          url: server.url || "",
          headers: server.headers || {},
        };
  return new MultiServerMCPClient({
    mcpServers: { [server.name]: connection },
    prefixToolNameWithServerName: false,
    throwOnLoadError: true,
  });
}

export async function connectPublicMCP(
  id: number | null,
  settings: Record<string, unknown>,
  signal: AbortSignal,
) {
  if (id === null) return { tools: [], close: async () => {} };
  const policy = await mcpRepository.getMCPSettings();
  const allowed = publicTools(settings);
  const list = await mcpRepository.getEnabledList();
  const visible = list.servers.filter((server) => allowed[server.id]?.length);
  const defaultServer =
    visible.find((server) => server.isDefault) || visible[0];
  const server = visible.find((server) => server.id === id);
  if (
    !policy.enabled ||
    !server ||
    (!policy.allowUserSelect && defaultServer?.id !== id)
  )
    throw new Error("该 MCP 服务器未获公开访问授权");
  const client = createMCPClient(server);
  const close = async () => {
    signal.removeEventListener("abort", onAbort);
    await client.close().catch(() => {});
  };
  const onAbort = () => {
    void close();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    signal.throwIfAborted();
    const pending = client.getTools();
    void pending.then(
      () => {
        if (signal.aborted) void close();
      },
      () => {},
    );
    const tools = await abortable(pending, signal);
    signal.throwIfAborted();
    const approved = tools.filter(
      (tool) =>
        allowed[id].includes(tool.name) && isReadOnlyTool(tool.metadata),
    );
    if (!approved.length)
      throw new Error("没有获准的只读工具，请检查公开工具配置");
    return { tools: approved, close };
  } catch (error) {
    await close();
    throw error;
  }
}
