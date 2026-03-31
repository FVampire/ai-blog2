import { NextApiResponse } from "next";
import { requireRole, AuthenticatedRequest } from "../../../../lib/auth-middleware";
import { mcpRepository } from "../../../../lib/repositories/MCPRepository";

// API 处理器
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const serverId = parseInt(id as string, 10);

  if (isNaN(serverId)) {
    return res.status(400).json({
      success: false,
      message: "无效的 MCP 服务器 ID",
    });
  }

  // 获取单个 MCP 服务器 (GET /api/admin/mcp/:id)
  if (req.method === "GET") {
    try {
      const server = await mcpRepository.getById(serverId);

      if (!server) {
        return res.status(404).json({
          success: false,
          message: "MCP 服务器不存在",
        });
      }

      return res.status(200).json({
        success: true,
        data: server,
      });
    } catch (error) {
      console.error("Get MCP server error:", error);
      return res.status(500).json({
        success: false,
        message: "获取 MCP 服务器失败",
      });
    }
  }

  // 更新 MCP 服务器 (PATCH /api/admin/mcp/:id)
  if (req.method === "PATCH" || req.method === "PUT") {
    try {
      const { name, description, command, script_path, args, env_vars, is_enabled, is_default, timeout_seconds } = req.body;

      const server = await mcpRepository.update(serverId, {
        name,
        description,
        command,
        script_path,
        args,
        env_vars,
        is_enabled,
        is_default,
        timeout_seconds,
      });

      if (!server) {
        return res.status(404).json({
          success: false,
          message: "MCP 服务器不存在",
        });
      }

      return res.status(200).json({
        success: true,
        data: server,
        message: "MCP 服务器更新成功",
      });
    } catch (error) {
      console.error("Update MCP server error:", error);
      return res.status(500).json({
        success: false,
        message: "更新 MCP 服务器失败",
      });
    }
  }

  // 删除 MCP 服务器 (DELETE /api/admin/mcp/:id)
  if (req.method === "DELETE") {
    try {
      const deleted = await mcpRepository.delete(serverId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "MCP 服务器不存在",
        });
      }

      return res.status(200).json({
        success: true,
        message: "MCP 服务器删除成功",
      });
    } catch (error) {
      console.error("Delete MCP server error:", error);
      return res.status(500).json({
        success: false,
        message: "删除 MCP 服务器失败",
      });
    }
  }

  // 设置默认 MCP 服务器 (POST /api/admin/mcp/:id)
  if (req.method === "POST") {
    try {
      const { action } = req.body;

      if (action === "set_default") {
        const success = await mcpRepository.setDefault(serverId);

        if (!success) {
          return res.status(404).json({
            success: false,
            message: "MCP 服务器不存在",
          });
        }

        return res.status(200).json({
          success: true,
          message: "默认 MCP 服务器设置成功",
        });
      }

      return res.status(400).json({
        success: false,
        message: "无效的操作",
      });
    } catch (error) {
      console.error("Set default MCP server error:", error);
      return res.status(500).json({
        success: false,
        message: "设置默认 MCP 服务器失败",
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: "方法不允许",
  });
}

// 需要管理员权限
export default requireRole(["admin"])(handler);
