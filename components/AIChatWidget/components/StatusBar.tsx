import React from 'react';

import type { MCPServer } from '../../../types/ai-chat';

interface StatusBarProps {
  useMCP: boolean;
  selectedMCP: number | null;
  mcpServers: MCPServer[];
  selectedKnowledgeBase: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  useMCP,
  selectedMCP,
  mcpServers,
  selectedKnowledgeBase,
}) => {
  if (!useMCP && !selectedMCP && !selectedKnowledgeBase) {
    return null;
  }

  return (
    <div className="ai-status-bar">
      {useMCP && (
        <span className="ai-status-tag mcp">
          &#x1F527; MCP 已启用
        </span>
      )}
      {useMCP && selectedMCP && (
        <span className="ai-status-tag mcp-server">
          &#x1F50C; {mcpServers.find(s => s.id === selectedMCP)?.name || 'MCP服务器'}
        </span>
      )}
      {selectedKnowledgeBase && (
        <span className="ai-status-tag kb">
          &#x1F4DA; {'默认知识库'}
        </span>
      )}
    </div>
  );
};

export default StatusBar;
