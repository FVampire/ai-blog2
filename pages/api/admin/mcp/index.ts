import { NextApiRequest, NextApiResponse } from 'next';
import { requireRole, authMiddleware, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { mcpRepository, MCPServer } from '../../../../lib/repositories/MCPRepository';

// API 处理器
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // 获取所有 MCP 服务器 (GET /api/admin/mcp)
  if (req.method === 'GET') {
    try {
      const servers = await mcpRepository.getAll();
      return res.status(200).json({
        success: true,
        data: servers,
      });
    } catch (error) {
      console.error('Get MCP servers error:', error);
      return res.status(500).json({
        success: false,
        message: '获取 MCP 服务器列表失败',
      });
    }
  }

  // 创建 MCP 服务器 (POST /api/admin/mcp)
  if (req.method === 'POST') {
    try {
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
        timeout_seconds
      } = req.body;

      // 根据传输类型验证必填字段
      if (!name) {
        return res.status(400).json({
          success: false,
          message: '名称不能为空',
        });
      }

      const transportType = transport || 'stdio';

      // STDIO 类型需要 command 和 script_path
      if (transportType === 'stdio' && (!command || !script_path)) {
        return res.status(400).json({
          success: false,
          message: 'STDIO 类型需要命令和脚本路径',
        });
      }

      // SSE/HTTP 类型需要 url
      if ((transportType === 'sse' || transportType === 'http') && !url) {
        return res.status(400).json({
          success: false,
          message: 'SSE/HTTP 类型需要服务器 URL',
        });
      }

      const server = await mcpRepository.create({
        name,
        description: description || '',
        transport: transportType,
        command: command || '',
        script_path: script_path || '',
        args: args || [],
        env_vars: env_vars || {},
        url: url || '',
        headers: headers || {},
        is_enabled: is_enabled ?? true,
        timeout_seconds: timeout_seconds || 30,
      });

      return res.status(201).json({
        success: true,
        data: server,
        message: 'MCP 服务器创建成功',
      });
    } catch (error) {
      console.error('Create MCP server error:', error);
      return res.status(500).json({
        success: false,
        message: '创建 MCP 服务器失败',
      });
    }
  }

  // 批量更新 MCP 服务器 (PUT /api/admin/mcp)
  if (req.method === 'PUT') {
    try {
      const { servers, defaultServerId } = req.body;

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
      return res.status(200).json({
        success: true,
        data: updatedServers,
        message: 'MCP 服务器更新成功',
      });
    } catch (error) {
      console.error('Update MCP servers error:', error);
      return res.status(500).json({
        success: false,
        message: '更新 MCP 服务器失败',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '方法不允许',
  });
}

// 需要管理员权限
export default requireRole(['admin'])(handler);
