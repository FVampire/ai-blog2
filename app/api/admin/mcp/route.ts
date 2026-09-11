import { NextRequest, NextResponse } from "next/server";

import { requireRoles, isAuthError } from "@/lib/auth-middleware-app";
import { mcpRepository } from "@/lib/repositories/MCPRepository";
import { mcpInputSchema } from "@/lib/ai/mcp-input";

export async function GET(request: NextRequest) {
  const authResult = requireRoles(request, ["admin"]);
  if (isAuthError(authResult)) return authResult;

  try {
    const servers = await mcpRepository.getAll();
    return NextResponse.json({ success: true, data: servers });
  } catch (error) {
    console.error("Get MCP servers error:", error);
    return NextResponse.json(
      { success: false, message: "获取 MCP 服务器列表失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = requireRoles(request, ["admin"]);
  if (isAuthError(authResult)) return authResult;

  try {
    const parsed = mcpInputSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        {
          success: false,
          message: "MCP 配置格式无效，请检查参数、环境变量和超时",
        },
        { status: 400 },
      );
    const {
      name,
      description,
      transport,
      command,
      script_path,
      args,
      env_vars,
      url,
      headers,
      is_enabled,
      is_default,
      timeout_seconds,
    } = parsed.data;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "名称不能为空" },
        { status: 400 },
      );
    }

    const transportType = transport || "stdio";

    if (transportType === "stdio" && !command) {
      return NextResponse.json(
        { success: false, message: "STDIO 类型需要可执行命令" },
        { status: 400 },
      );
    }

    if ((transportType === "sse" || transportType === "http") && !url) {
      return NextResponse.json(
        { success: false, message: "SSE/HTTP 类型需要服务器 URL" },
        { status: 400 },
      );
    }

    const server = await mcpRepository.create({
      name,
      description: description || "",
      transport: transportType,
      command: command || "",
      script_path: script_path || "",
      args: args || [],
      env_vars: env_vars || {},
      url: url || "",
      headers: headers || {},
      is_enabled: is_enabled ?? true,
      timeout_seconds: timeout_seconds || 30,
    });
    if (is_default) {
      await mcpRepository.setDefault(server.id);
      server.isDefault = true;
    }

    return NextResponse.json(
      { success: true, data: server, message: "MCP 服务器创建成功" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create MCP server error:", error);
    return NextResponse.json(
      { success: false, message: "创建 MCP 服务器失败" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = requireRoles(request, ["admin"]);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const { servers, defaultServerId } = body;

    if (
      servers !== undefined &&
      (!Array.isArray(servers) ||
        servers.some((server: Record<string, unknown>) => {
          if (!Number.isInteger(server.id) || Number(server.id) < 1)
            return true;
          const { id: _id, ...input } = server;
          return !mcpInputSchema.safeParse(input).success;
        }))
    )
      return NextResponse.json(
        { success: false, message: "MCP 批量配置无效" },
        { status: 400 },
      );
    if (
      defaultServerId !== undefined &&
      (!Number.isInteger(defaultServerId) || defaultServerId < 1)
    )
      return NextResponse.json(
        { success: false, message: "默认服务器 ID 无效" },
        { status: 400 },
      );

    if (servers && Array.isArray(servers)) {
      for (const server of servers) {
        if (server.id) {
          await mcpRepository.update(server.id, {
            name: server.name,
            description: server.description,
            transport: server.transport,
            command: server.command,
            script_path: server.script_path,
            args: server.args,
            env_vars: server.env_vars,
            url: server.url,
            headers: server.headers,
            is_enabled: server.is_enabled,
            timeout_seconds: server.timeout_seconds,
          });
        }
      }
    }

    if (defaultServerId) {
      await mcpRepository.setDefault(defaultServerId);
    }

    const updatedServers = await mcpRepository.getAll();
    return NextResponse.json({
      success: true,
      data: updatedServers,
      message: "MCP 服务器更新成功",
    });
  } catch (error) {
    console.error("Update MCP servers error:", error);
    return NextResponse.json(
      { success: false, message: "更新 MCP 服务器失败" },
      { status: 500 },
    );
  }
}
