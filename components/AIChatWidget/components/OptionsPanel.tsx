import React from "react";

import { CloseIcon } from "./Icons";
import type { MCPServer, KnowledgeBase } from "../../../types/ai-chat";

interface OptionsPanelProps {
  show: boolean;
  onClose: () => void;
  mcpEnabled?: boolean;
  useMCP: boolean;
  onToggleMCP: () => void;
  mcpAllowUserSelect?: boolean;
  mcpServers: MCPServer[];
  selectedMCP: number | null;
  onSelectMCP: (id: number | null) => void;
  knowledgeBases: KnowledgeBase[];
  selectedKnowledgeBase: string;
  onSelectKnowledgeBase: (id: string) => void;
}

const OptionsPanel: React.FC<OptionsPanelProps> = ({
  show,
  onClose,
  mcpEnabled,
  useMCP,
  onToggleMCP,
  mcpAllowUserSelect,
  mcpServers,
  selectedMCP,
  onSelectMCP,
  knowledgeBases,
  selectedKnowledgeBase,
  onSelectKnowledgeBase,
}) => {
  if (!show) return null;

  return (
    <div className="ai-options-panel">
      <div className="ai-options-header">
        <span>选项设置</span>
        <button
          type="button"
          className="ai-options-close"
          onClick={onClose}
          aria-label="关闭选项"
        >
          <CloseIcon size={14} />
        </button>
      </div>
      <div className="ai-options-content">
        {mcpEnabled && (
          <div className="ai-option-item">
            <div className="ai-option-info">
              <span className="ai-option-label">MCP 工具</span>
              <span className="ai-option-desc">启用 MCP 扩展功能</span>
            </div>
            <button
              type="button"
              className={`ai-toggle-btn ${useMCP ? "active" : ""}`}
              aria-pressed={useMCP}
              onClick={onToggleMCP}
            >
              {useMCP ? "开" : "关"}
            </button>
          </div>
        )}

        {mcpEnabled &&
          mcpAllowUserSelect &&
          useMCP &&
          mcpServers.length > 0 && (
            <div className="ai-option-item ai-knowledge-base">
              <span className="ai-option-label">MCP 服务器</span>
              <div className="ai-knowledge-list">
                {mcpServers.map((server) => (
                  <button
                    type="button"
                    key={server.id}
                    className={`ai-knowledge-chip ${selectedMCP === server.id ? "active" : ""}`}
                    onClick={() => onSelectMCP(server.id)}
                    aria-pressed={selectedMCP === server.id}
                    title={server.description}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            </div>
          )}

        <div className="ai-option-item ai-knowledge-base">
          <span className="ai-option-label">知识库</span>
          <div className="ai-knowledge-list">
            {knowledgeBases.map((kb) => (
              <button
                type="button"
                key={kb.id}
                className={`ai-knowledge-chip ${selectedKnowledgeBase === kb.id ? "active" : ""}`}
                onClick={() => onSelectKnowledgeBase(kb.id)}
                aria-pressed={selectedKnowledgeBase === kb.id}
                title={kb.description}
              >
                {kb.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsPanel;
