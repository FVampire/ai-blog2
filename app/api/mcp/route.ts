import { NextRequest, NextResponse } from 'next/server';

import { requireAgentAuth } from '@/lib/auth-middleware-app';
import { handleMcpRpc, MCP_PROTOCOL_VERSION, MCP_SERVER_INFO } from '@/lib/mcp/handler';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit-api';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Agent-Key, mcp-session-id, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
};

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  response.headers.set('mcp-protocol-version', MCP_PROTOCOL_VERSION);
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return withCors(authResult);

  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/event-stream')) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: endpoint\ndata: /api/mcp\n\n'));
      },
    });
    return withCors(new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    }));
  }

  return withCors(NextResponse.json({
    name: MCP_SERVER_INFO.name,
    version: MCP_SERVER_INFO.version,
    protocolVersion: MCP_PROTOCOL_VERSION,
    transport: 'streamable-http',
    tools: ['search_posts', 'get_post', 'list_posts', 'list_projects', 'get_project', 'list_series', 'get_series', 'publish_post', 'list_distribution_jobs'],
  }));
}

export async function POST(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return withCors(authResult);

  const ip = getClientIp(request);
  const limit = checkRateLimit(`mcp:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return withCors(NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message: '请求过于频繁' }, id: null },
      { status: 429 },
    ));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 },
    ));
  }

  const result = await handleMcpRpc(body);
  if (result == null) return withCors(new NextResponse(null, { status: 202 }));
  return withCors(NextResponse.json(result));
}
