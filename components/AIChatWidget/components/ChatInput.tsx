'use client';

import React, { useEffect } from 'react';

import { SendIcon, SettingsIcon, StopIcon } from './Icons';
import type { Command } from '../../../types/ai-chat';

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStop?: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  loading: boolean;
  isStreaming: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
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
  onStop,
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
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input, inputRef]);

  const busy = loading || isStreaming;
  const canSend = !busy && !!input.trim();

  return (
    <div className="ai-chat-input">
      <button
        type="button"
        className={`ai-options-toggle ${hasActiveOptions ? 'active' : ''}`}
        onClick={onToggleOptions}
        title="选项设置"
        aria-label="选项设置"
      >
        <SettingsIcon size={18} />
      </button>

      {showCommandHints && (
        <div className="ai-command-hints">
          <div className="ai-command-hints-header">
            <span>可用命令</span>
            <span className="ai-command-hints-shortcut">Tab 补全 · ↑↓ 选择 · Esc 关闭</span>
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

      <textarea
        ref={inputRef}
        rows={1}
        value={input}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        placeholder="输入消息，Enter 发送"
        disabled={busy}
        aria-label="对话输入"
      />
      {isStreaming ? (
        <button
          type="button"
          className="ai-send-btn stop"
          onClick={onStop}
          title="停止生成"
          aria-label="停止生成"
        >
          <StopIcon size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="ai-send-btn"
          onClick={onSend}
          disabled={!canSend}
          title="发送"
          aria-label="发送"
        >
          <SendIcon size={16} />
        </button>
      )}
    </div>
  );
};

export default ChatInput;
