import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import { useArticle } from "../contexts/ArticleContext";
import { readChatEvents, modelHistory } from "../lib/ai/protocol";
import { AVAILABLE_COMMANDS } from "../components/AIChatWidget/constants";
import type {
  Message,
  AIConfig,
  MCPServer,
  Command,
  KnowledgeMode,
} from "../types/ai-chat";

const STORAGE_KEY = "blog-ai-chat-v2";
const id = () => crypto.randomUUID();
export function useAIChat() {
  const { article } = useArticle();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("就绪");
  const [notice, setNotice] = useState("");
  const [useMCP, setUseMCP] = useState(false);
  const [selectedMCP, setSelectedMCP] = useState<number | null>(null);
  const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
  const [mode, setMode] = useState<KnowledgeMode>("none");
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [showCommandHints, setShowCommandHints] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const active = useRef<{
    id: string;
    messageId: string;
    controller: AbortController;
  } | null>(null);
  const initialized = useRef(false);
  const filteredCommands = AVAILABLE_COMMANDS.filter((cmd) =>
    cmd.name.includes(input.toLowerCase().trim()),
  );

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/ai/config", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error();
        setConfig(data.data);
        let restored: Message[] = [];
        try {
          const saved = JSON.parse(
            sessionStorage.getItem(STORAGE_KEY) || "null",
          );
          if (
            saved &&
            Date.now() - saved.savedAt < 86400000 &&
            Array.isArray(saved.messages)
          ) {
            restored = saved.messages
              .filter(
                (m: Message) =>
                  typeof m.id === "string" &&
                  ["user", "assistant"].includes(m.role) &&
                  typeof m.content === "string",
              )
              .slice(-40)
              .map((m: Message) => ({
                ...m,
                content: m.content.slice(0, 64000),
                status: m.status === "streaming" ? "stopped" : m.status,
              }));
          }
        } catch {
          /* Storage may be disabled. */
        }
        setMessages(
          restored.length
            ? restored
            : data.data.ai_assistant_welcome
              ? [
                  {
                    id: id(),
                    role: "assistant",
                    content: data.data.ai_assistant_welcome,
                    local: true,
                    status: "complete",
                  },
                ]
              : [],
        );
        initialized.current = true;
        if (data.data.mcp_enabled) {
          const mcpResponse = await fetch("/api/mcp/list", {
            signal: controller.signal,
            cache: "no-store",
          });
          const mcp = await mcpResponse.json();
          if (mcpResponse.ok && mcp.success) {
            setMCPServers(mcp.data.servers);
            setSelectedMCP(mcp.data.defaultServer?.id ?? null);
          }
        }
      } catch {
        if (!controller.signal.aborted)
          setNotice("助手配置暂时无法加载，请刷新页面重试。");
      } finally {
        if (!controller.signal.aborted) setConfigLoading(false);
      }
    };
    void load();
    return () => {
      controller.abort();
      active.current?.controller.abort();
      active.current = null;
    };
  }, []);

  useEffect(() => {
    if (!initialized.current || busy) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedAt: Date.now(), messages: messages.slice(-40) }),
      );
    } catch {
      /* Optional session recovery. */
    }
  }, [messages, busy]);
  useEffect(() => {
    setMode(article ? "article" : "none");
  }, [article?.id]);

  const update = (messageId: string, change: (message: Message) => Message) =>
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? change(m) : m)),
    );
  const stop = useCallback(() => {
    const request = active.current;
    if (!request) return;
    active.current = null;
    request.controller.abort();
    setBusy(false);
    setStatus("已停止");
    setMessages((prev) =>
      prev.map((m) =>
        m.id === request.messageId
          ? {
              ...m,
              status: "stopped",
              toolCalls: m.toolCalls?.map((t) =>
                t.status === "running"
                  ? { ...t, status: "error", error: "已停止" }
                  : t,
              ),
            }
          : m,
      ),
    );
  }, []);
  const clearContext = () => {
    stop();
    setNotice("");
    setMessages(
      config?.ai_assistant_welcome
        ? [
            {
              id: id(),
              role: "assistant",
              content: config.ai_assistant_welcome,
              local: true,
              status: "complete",
            },
          ]
        : [],
    );
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage is optional in private browsing and embedded webviews.
    }
  };
  const toggleMCP = () => {
    if (!config?.mcp_enabled || !mcpServers.length) {
      setNotice("当前没有可用的公开工具。");
      return;
    }
    setUseMCP((prev) => !prev);
    if (!selectedMCP) setSelectedMCP(mcpServers[0].id);
  };

  const run = async (
    history: Message[],
    context: NonNullable<Message["context"]>,
  ) => {
    if (active.current) return;
    const messageId = id();
    const requestId = id();
    const controller = new AbortController();
    active.current = { id: requestId, messageId, controller };
    setBusy(true);
    setStatus("正在连接");
    setNotice("");
    setMessages([
      ...history,
      {
        id: messageId,
        role: "assistant",
        content: "",
        status: "streaming",
        context,
      },
    ]);
    const timeout = window.setTimeout(() => controller.abort(), 100000);
    try {
      // UI notices, failed answers and greetings never enter model history.
      const modelMessages = modelHistory(history);
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          requestId,
          messageId,
          messages: modelMessages,
          mode: context.mode,
          articleId: context.mode === "article" ? context.articleId : undefined,
          mcpServerId: context.mcpServerId,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const retry = response.headers.get("Retry-After");
        throw new Error(
          (data.message || "请求失败") +
            (retry ? `，请在 ${retry} 秒后重试` : ""),
        );
      }
      if (
        !response.body ||
        !response.headers.get("Content-Type")?.includes("text/event-stream")
      )
        throw new Error("服务器响应格式错误");
      await readChatEvents(response.body, (event) => {
        if (
          active.current?.id !== requestId ||
          event.requestId !== requestId ||
          event.messageId !== messageId
        )
          return;
        if (event.type === "error") throw new Error(event.text);
        if (event.type === "status") setStatus(event.text);
        else if (event.type === "text-delta")
          update(messageId, (m) => ({ ...m, content: m.content + event.text }));
        else if (event.type === "sources")
          update(messageId, (m) => ({ ...m, sources: event.sources }));
        else if (event.type === "warning")
          update(messageId, (m) => ({ ...m, warning: event.text }));
        else if (event.type === "tool-start") {
          setStatus(`正在使用 ${event.name}`);
          update(messageId, (m) => ({
            ...m,
            toolCalls: [
              ...(m.toolCalls || []),
              {
                id: event.id,
                name: event.name,
                description: "只读工具",
                arguments: {},
                status: "running",
              },
            ],
          }));
        } else if (event.type === "tool-result")
          update(messageId, (m) => ({
            ...m,
            toolCalls: m.toolCalls?.map((t) =>
              t.id === event.id
                ? {
                    ...t,
                    status: event.ok ? "success" : "error",
                    result: event.ok ? "执行完成" : undefined,
                    error: event.ok ? undefined : "执行失败",
                  }
                : t,
            ),
          }));
        else if (event.type === "done") {
          update(messageId, (m) => ({ ...m, status: "complete" }));
          setStatus("就绪");
        }
      });
    } catch (error) {
      if (active.current?.id === requestId) {
        const errorText = controller.signal.aborted
          ? "请求超时，请重试。"
          : error instanceof Error
            ? error.message
            : "请求失败，请重试。";
        update(messageId, (m) => ({
          ...m,
          status: "error",
          error: errorText,
          toolCalls: m.toolCalls?.map((t) =>
            t.status === "running"
              ? { ...t, status: "error", error: "请求未完成" }
              : t,
          ),
        }));
        setStatus("回答未完成");
      }
    } finally {
      clearTimeout(timeout);
      if (active.current?.id === requestId) {
        active.current = null;
        setBusy(false);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const sendMessage = async (text = input) => {
    if (active.current || !text.trim()) return;
    const content = text.trim();
    if (content.length > 12000) {
      setNotice("单条消息最多 12000 字符。");
      return;
    }
    setInput("");
    setShowCommandHints(false);
    if (content === "/clear") {
      clearContext();
      return;
    }
    if (content === "/mcp") {
      toggleMCP();
      return;
    }
    if (content === "/kb") {
      setShowOptionsPanel((prev) => !prev);
      return;
    }
    if (content === "/help") {
      setMessages((prev) => [
        ...prev,
        {
          id: id(),
          role: "assistant",
          local: true,
          content: AVAILABLE_COMMANDS.map(
            (cmd) => `${cmd.name}：${cmd.description}`,
          ).join("\n\n"),
        },
      ]);
      return;
    }
    const context = {
      mode,
      articleId: article?.id,
      title: mode === "article" ? article?.title : undefined,
      mcpServerId: useMCP ? selectedMCP : null,
    };
    await run(
      [...messages, { id: id(), role: "user", content, context }],
      context,
    );
  };
  const regenerate = async (messageId: string) => {
    if (active.current) return;
    const index = messages.findIndex((m) => m.id === messageId);
    const history = messages.slice(0, index);
    const user = [...history].reverse().find((m) => m.role === "user");
    if (user?.context) await run(history, user.context);
  };
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setShowCommandHints(e.target.value.startsWith("/"));
    setSelectedCommandIndex(0);
  };
  const autoCompleteCommand = (command: Command) => {
    setInput(command.name);
    setShowCommandHints(false);
    inputRef.current?.focus();
  };
  return {
    isOpen,
    setIsOpen,
    config,
    configLoading,
    messages,
    input,
    busy,
    status,
    notice,
    useMCP,
    toggleMCP,
    selectedMCP,
    setSelectedMCP,
    mcpServers,
    mode,
    setMode,
    showOptionsPanel,
    setShowOptionsPanel,
    showCommandHints,
    setShowCommandHints,
    filteredCommands,
    selectedCommandIndex,
    setSelectedCommandIndex,
    inputRef,
    article,
    sendMessage,
    regenerate,
    stop,
    clearContext,
    handleInputChange,
    autoCompleteCommand,
  };
}
