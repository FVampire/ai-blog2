import { NextRequest, NextResponse } from 'next/server';

import { requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import { mcpRepository } from '@/lib/repositories/MCPRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const serverId = parseInt((await params).id, 10);
  if (isNaN(serverId)) {
    return NextResponse.json(
      { success: false, message: "无效的 MCP 服务器 ID" },
      { status: 400 }
    );
  }

  try {
    const server = await mcpRepository.getById(serverId);
    if (!server) {
      return NextResponse.json(
        { success: false, message: "MCP 服务器不存在" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: server });
  } catch (error) {
    console.error("Get MCP server error:", error);
    return NextResponse.json(
      { success: false, message: "获取 MCP 服务器失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, (await params).id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, (await params).id);
}

async function handleUpdate(request: NextRequest, id: string) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const serverId = parseInt(id, 10);
  if (isNaN(serverId)) {
    return NextResponse.json(
      { success: false, message: "无效的 MCP 服务器 ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, transport, command, script_path, args, env_vars, url, headers, is_enabled, is_default, timeout_seconds } = body;

    const server = await mcpRepository.update(serverId, {
      name, description, transport, command, script_path, args, env_vars, url, headers, is_enabled, is_default, timeout_seconds,
    });

    if (!server) {
      return NextResponse.json(
        { success: false, message: "MCP 服务器不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true, data: server, message: "MCP 服务器更新成功",
    });
  } catch (error) {
    console.error("Update MCP server error:", error);
    return NextResponse.json(
      { success: false, message: "更新 MCP 服务器失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const serverId = parseInt((await params).id, 10);
  if (isNaN(serverId)) {
    return NextResponse.json(
      { success: false, message: "无效的 MCP 服务器 ID" },
      { status: 400 }
    );
  }

  try {
    const deleted = await mcpRepository.delete(serverId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "MCP 服务器不存在" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "MCP 服务器删除成功" });
  } catch (error) {
    console.error("Delete MCP server error:", error);
    return NextResponse.json(
      { success: false, message: "删除 MCP 服务器失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const serverId = parseInt((await params).id, 10);
  if (isNaN(serverId)) {
    return NextResponse.json(
      { success: false, message: "无效的 MCP 服务器 ID" },
      { status: 400 }
    );
  }

  try {
    const { action } = await request.json();

    if (action === "set_default") {
      const success = await mcpRepository.setDefault(serverId);
      if (!success) {
        return NextResponse.json(
          { success: false, message: "MCP 服务器不存在" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: "默认 MCP 服务器设置成功" });
    }

    return NextResponse.json(
      { success: false, message: "无效的操作" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Set default MCP server error:", error);
    return NextResponse.json(
      { success: false, message: "设置默认 MCP 服务器失败" },
      { status: 500 }
    );
  }
}
