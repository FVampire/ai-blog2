import React from 'react';

import type { Command } from '../../../types/ai-chat';

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  loading: boolean;
  isStreaming: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  showCommandHints: boolean;
  filteredCommands: Command[];
  selectedCommandIndex: number;
  onAutoComplete: (command: Command) => void;
  onSetSelectedIndex: (index: number) => void;
  onToggleOptions: () => void;
  hasActiveOptions: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSend,
  onKeyDown,
  loading,
  isStreaming,
  inputRef,
  showCommandHints,
  filteredCommands,
  selectedCommandIndex,
  onAutoComplete,
  onSetSelectedIndex,
  onToggleOptions,
  hasActiveOptions,
}) => {
  return (
    <div className="ai-chat-input">
      {/* Options button */}
      <button
        className={`ai-options-toggle ${hasActiveOptions ? 'active' : ''}`}
        onClick={onToggleOptions}
        title="选项设置"
      >
        &#x2699;&#xFE0F;
      </button>

      {/* Command hints dropdown */}
      {showCommandHints && (
        <div className="ai-command-hints">
          <div className="ai-command-hints-header">
            <span>可用命令</span>
            <span className="ai-command-hints-shortcut">Tab 补全 &middot; &uarr;&darr; 选择 &middot; Esc 关闭</span>
          </div>
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd.name}
              className={`ai-command-item ${index === selectedCommandIndex ? 'selected' : ''}`}
              onClick={() => onAutoComplete(cmd)}
              onMouseEnter={() => onSetSelectedIndex(index)}
            >
              <span className="ai-command-name">{cmd.name}</span>
              <span className="ai-command-desc">{cmd.description}</span>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        placeholder="输入消息... (输入 / 查看命令)"
        disabled={loading || isStreaming}
      />
      <button onClick={onSend} disabled={loading || isStreaming || !input.trim()}>
        {isStreaming ? '生成中...' : '发送'}
      </button>
    </div>
  );
};

export default ChatInput;
