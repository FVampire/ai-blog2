import React, { useState } from 'react';

interface ToolCall {
  id: string;
  name: string;
  description: string;
  arguments: Record<string, any>;
  status: 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}

// 工具调用卡片组件
const ToolCallCard: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const statusIcon = {
    running: '⏳',
    success: '✅',
    error: '❌'
  }[toolCall.status];

  const statusText = {
    running: '执行中',
    success: '已完成',
    error: '失败'
  }[toolCall.status];

  const statusColor = {
    running: '#f59e0b',
    success: '#10b981',
    error: '#ef4444'
  }[toolCall.status];

  return (
    <div
      className={`ai-tool-call-card ${toolCall.status}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="tool-call-main">
        <span className="tool-call-icon">{statusIcon}</span>
        <span className="tool-call-name">{toolCall.name}</span>
        <span className="tool-call-desc">{toolCall.description}</span>
        <span className="tool-call-status-badge" style={{ background: `${statusColor}20`, color: statusColor }}>
          {statusText}
        </span>
        <span className="tool-call-expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {/* 悬浮详情面板 */}
      {isHovered && !isExpanded && (
        <div className="tool-call-hover-panel">
          <div className="hover-panel-section">
            <div className="hover-panel-title">🔧 工具名称</div>
            <div className="hover-panel-value">{toolCall.name}</div>
          </div>
          {toolCall.description && (
            <div className="hover-panel-section">
              <div className="hover-panel-title">📝 描述</div>
              <div className="hover-panel-value">{toolCall.description}</div>
            </div>
          )}
          <div className="hover-panel-section">
            <div className="hover-panel-title">📥 输入参数</div>
            <pre className="hover-panel-code">{JSON.stringify(toolCall.arguments, null, 2)}</pre>
          </div>
          {toolCall.status === 'success' && toolCall.result && (
            <div className="hover-panel-section">
              <div className="hover-panel-title">📤 输出结果</div>
              <pre className="hover-panel-code">
                {typeof toolCall.result === 'string' && toolCall.result.length > 300
                  ? toolCall.result.substring(0, 300) + '...'
                  : toolCall.result}
              </pre>
            </div>
          )}
          {toolCall.status === 'error' && toolCall.error && (
            <div className="hover-panel-section">
              <div className="hover-panel-title">❌ 错误信息</div>
              <pre className="hover-panel-code error">{toolCall.error}</pre>
            </div>
          )}
        </div>
      )}

      {/* 展开详情面板 */}
      {isExpanded && (
        <div className="tool-call-expand-panel">
          <div className="expand-panel-section">
            <div className="expand-panel-title">🔧 工具名称</div>
            <div className="expand-panel-value">{toolCall.name}</div>
          </div>
          {toolCall.description && (
            <div className="expand-panel-section">
              <div className="expand-panel-title">📝 描述</div>
              <div className="expand-panel-value">{toolCall.description}</div>
            </div>
          )}
          <div className="expand-panel-section">
            <div className="expand-panel-title">📥 输入参数</div>
            <pre className="expand-panel-code">{JSON.stringify(toolCall.arguments, null, 2)}</pre>
          </div>
          {toolCall.status === 'success' && toolCall.result && (
            <div className="expand-panel-section">
              <div className="expand-panel-title">📤 输出结果</div>
              <pre className="expand-panel-code">
                {typeof toolCall.result === 'string' && toolCall.result.length > 1000
                  ? toolCall.result.substring(0, 1000) + '\n... (结果过长，仅显示前1000字符)'
                  : toolCall.result}
              </pre>
            </div>
          )}
          {toolCall.status === 'error' && toolCall.error && (
            <div className="expand-panel-section">
              <div className="expand-panel-title">❌ 错误信息</div>
              <pre className="expand-panel-code error">{toolCall.error}</pre>
            </div>
          )}
          {toolCall.startTime && (
            <div className="tool-call-time">
              开始时间: {new Date(toolCall.startTime).toLocaleString('zh-CN')}
              {toolCall.endTime && ` | 结束时间: ${new Date(toolCall.endTime).toLocaleString('zh-CN')}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolCallCard;
