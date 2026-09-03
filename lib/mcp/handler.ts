import { callMcpTool, MCP_TOOLS } from './tools';

export const MCP_PROTOCOL_VERSION = '2025-03-26';
export const MCP_SERVER_INFO = { name: 'ai-blog2', version: '1.1.0' };

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function ok(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function fail(id: string | number | null, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

async function handleSingle(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const id = request.id ?? null;
  const method = request.method || '';
  const params = request.params || {};

  if (method.startsWith('notifications/')) return null;

  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SERVER_INFO,
        instructions: 'This MCP server exposes the blog: search and read posts, list projects and series, and publish drafts. Prefer draft unless the user asks to publish.',
      });
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: MCP_TOOLS });
    case 'tools/call': {
      const name = String(params.name || '');
      const args = (params.arguments && typeof params.arguments === 'object')
        ? params.arguments as Record<string, unknown>
        : {};
      try {
        const result = await callMcpTool(name, args);
        return ok(id, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : '工具调用失败';
        return ok(id, {
          isError: true,
          content: [{ type: 'text', text: message }],
        });
      }
    }
    default:
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

export async function handleMcpRpc(body: unknown): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
  if (Array.isArray(body)) {
    const responses: JsonRpcResponse[] = [];
    for (const item of body) {
      const response = await handleSingle(item as JsonRpcRequest);
      if (response) responses.push(response);
    }
    return responses;
  }
  return handleSingle(body as JsonRpcRequest);
}
