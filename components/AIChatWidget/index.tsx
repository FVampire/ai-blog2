"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";
import { BookIcon, BotIcon, CloseIcon, TrashIcon } from "./components/Icons";
import OptionsPanel from "./components/OptionsPanel";
import SuggestionChips from "./components/SuggestionChips";
import { getArticleSuggestions } from "./constants";
import { useAIChat } from "../../hooks/useAIChat";
import type { KnowledgeMode } from "../../types/ai-chat";
import SafeImage from "../SafeImage";
import "./AIChatWidget.css";

export default function AIChatWidget() {
  const chat = useAIChat();
  const windowRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [hasNew, setHasNew] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const close = () => {
    chat.setIsOpen(false);
    window.setTimeout(() => toggleRef.current?.focus(), 0);
  };
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!chat.isOpen) return;
    chat.inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      if (isMobile) document.body.style.overflow = previousOverflow;
    };
  }, [chat.isOpen, chat.inputRef, isMobile]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (nearBottom.current) {
      el.scrollTop = el.scrollHeight;
      setHasNew(false);
    } else setHasNew(true);
  }, [chat.messages, chat.isOpen]);
  const keyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (chat.showCommandHints && chat.filteredCommands.length) {
      if (event.key === "Tab") {
        event.preventDefault();
        chat.autoCompleteCommand(
          chat.filteredCommands[chat.selectedCommandIndex] ||
            chat.filteredCommands[0],
        );
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        chat.setSelectedCommandIndex(
          (chat.selectedCommandIndex +
            (event.key === "ArrowDown" ? 1 : -1) +
            chat.filteredCommands.length) %
            chat.filteredCommands.length,
        );
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!chat.busy) {
        nearBottom.current = true;
        void chat.sendMessage();
      }
    }
  };
  const dialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (chat.showCommandHints) chat.setShowCommandHints(false);
      else if (chat.showOptionsPanel) chat.setShowOptionsPanel(false);
      else close();
    }
    if (
      event.key === "Tab" &&
      !event.defaultPrevented &&
      window.matchMedia("(max-width: 640px)").matches
    ) {
      const elements = Array.from(
        windowRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), textarea, a[href]",
        ) || [],
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };
  if (
    chat.configLoading ||
    (chat.config &&
      (!chat.config.ai_available || !chat.config.ai_assistant_enabled))
  )
    return null;
  const name = chat.config?.ai_assistant_name || "AI 助手";
  const modes = [
    { id: "none", name: "普通对话", description: "不检索博客" },
    ...(chat.article
      ? [{ id: "article", name: "当前文章", description: "参考正在阅读的文章" }]
      : []),
    ...(chat.config?.knowledge_available
      ? [
          {
            id: "site",
            name: "全站文章",
            description: "检索博客文章并引用来源",
          },
        ]
      : []),
  ];
  const lastAssistant = [...chat.messages]
    .reverse()
    .find((m) => m.role === "assistant" && !m.local)?.id;
  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={`ai-chat-toggle ${chat.isOpen ? "open" : ""}`}
        onClick={() => (chat.isOpen ? close() : chat.setIsOpen(true))}
        aria-label={chat.isOpen ? "关闭对话" : `打开${name}`}
        aria-expanded={chat.isOpen}
        aria-controls="ai-chat-dialog"
      >
        <BotIcon size={26} />
      </button>
      {chat.isOpen && (
        <>
          <div
            className="ai-chat-backdrop"
            onClick={close}
            aria-hidden="true"
          />
          <div
            id="ai-chat-dialog"
            ref={windowRef}
            className="ai-chat-window"
            role="dialog"
            aria-modal={isMobile || undefined}
            aria-label={`${name}对话窗口`}
            onKeyDown={dialogKeyDown}
          >
            <div className="ai-chat-header">
              <div className="ai-chat-title">
                <span className="ai-avatar">
                  {chat.config?.ai_assistant_avatar ? (
                    <SafeImage
                      src={chat.config.ai_assistant_avatar}
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                    />
                  ) : (
                    <BotIcon size={18} />
                  )}
                </span>
                <div className="ai-header-info">
                  <span>{name}</span>
                  <span role="status" aria-live="polite">
                    {chat.status}
                  </span>
                </div>
              </div>
              <div className="ai-header-actions">
                <button
                  type="button"
                  className="ai-clear-btn"
                  onClick={chat.clearContext}
                  aria-label="新建对话并清除本地记录"
                  title="新建对话"
                >
                  <TrashIcon size={15} />
                </button>
                <button
                  type="button"
                  className="ai-chat-close"
                  onClick={close}
                  aria-label="关闭"
                >
                  <CloseIcon size={15} />
                </button>
              </div>
            </div>
            <div className="ai-article-context">
              <BookIcon size={14} />
              <span className="context-text">
                {chat.mode === "article"
                  ? `当前文章：${chat.article?.title || "未选择"}`
                  : chat.mode === "site"
                    ? "知识来源：全站文章"
                    : "普通对话 · 不检索博客"}
              </span>
            </div>
            <div
              className="ai-chat-messages"
              ref={scrollRef}
              onScroll={() => {
                const el = scrollRef.current!;
                nearBottom.current =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 60;
                if (nearBottom.current) setHasNew(false);
              }}
            >
              {chat.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={msg.status === "streaming"}
                  isLastAssistant={msg.id === lastAssistant}
                  onRegenerate={
                    !chat.busy && msg.id === lastAssistant
                      ? () => void chat.regenerate(msg.id)
                      : undefined
                  }
                />
              ))}
              {chat.article &&
                !chat.messages.some((m) => m.role === "user") && (
                  <SuggestionChips
                    suggestions={getArticleSuggestions(chat.article)}
                    onSend={(text) => {
                      nearBottom.current = true;
                      void chat.sendMessage(text);
                    }}
                    disabled={chat.busy}
                  />
                )}
            </div>
            {hasNew && (
              <button
                className="ai-new-messages"
                onClick={() => {
                  nearBottom.current = true;
                  if (scrollRef.current)
                    scrollRef.current.scrollTop =
                      scrollRef.current.scrollHeight;
                  setHasNew(false);
                }}
              >
                查看最新回答 ↓
              </button>
            )}
            {chat.notice && (
              <div className="ai-chat-notice" role="alert">
                {chat.notice}
              </div>
            )}
            <OptionsPanel
              show={chat.showOptionsPanel}
              onClose={() => chat.setShowOptionsPanel(false)}
              mcpEnabled={chat.config?.mcp_enabled}
              useMCP={chat.useMCP}
              onToggleMCP={chat.toggleMCP}
              mcpAllowUserSelect={chat.config?.mcp_allow_user_select}
              mcpServers={chat.mcpServers}
              selectedMCP={chat.selectedMCP}
              onSelectMCP={chat.setSelectedMCP}
              knowledgeBases={modes}
              selectedKnowledgeBase={chat.mode}
              onSelectKnowledgeBase={(value) => {
                chat.setMode(value as KnowledgeMode);
                chat.setShowOptionsPanel(false);
              }}
            />
            <ChatInput
              input={chat.input}
              onInputChange={chat.handleInputChange}
              onSend={() => {
                nearBottom.current = true;
                void chat.sendMessage();
              }}
              onStop={chat.stop}
              onKeyDown={keyDown}
              loading={!chat.config}
              isStreaming={chat.busy}
              inputRef={chat.inputRef}
              showCommandHints={
                chat.showCommandHints && chat.filteredCommands.length > 0
              }
              filteredCommands={chat.filteredCommands}
              selectedCommandIndex={chat.selectedCommandIndex}
              onAutoComplete={chat.autoCompleteCommand}
              onSetSelectedIndex={chat.setSelectedCommandIndex}
              onToggleOptions={() =>
                chat.setShowOptionsPanel(!chat.showOptionsPanel)
              }
              hasActiveOptions={chat.useMCP || chat.mode !== "none"}
            />
            <div className="ai-status-bar">
              {chat.useMCP
                ? `工具：${chat.mcpServers.find((s) => s.id === chat.selectedMCP)?.name || "未选择"}`
                : "工具关闭"}{" "}
              · 对话暂存在本标签页，24 小时后失效
            </div>
          </div>
        </>
      )}
    </>
  );
}
