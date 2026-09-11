import { PostRepository } from "../repositories/PostRepository";
import { VectorRepository } from "../repositories/VectorRepository";
import { generateQueryEmbedding } from "../embedding";
import type { Source } from "./protocol";

export async function buildChatContext(
  input: {
    mode: "none" | "article" | "site";
    articleId?: number;
    messages: { role: string; content: string }[];
  },
  settings: Record<string, any>,
  signal: AbortSignal,
) {
  const sources: Source[] = [];
  const excerpts: string[] = [];
  if (input.mode === "none") return { sources, text: "" };
  if (input.mode === "article") {
    const post = await PostRepository.getPostById(input.articleId!);
    signal.throwIfAborted();
    if (!post || post.status !== "published")
      throw new Error("当前文章不可用或尚未发布");
    sources.push({
      id: post.id,
      title: post.title,
      url: `/posts/${encodeURIComponent(post.slug)}`,
    });
    excerpts.push(
      JSON.stringify({
        title: post.title,
        url: sources[0].url,
        content: post.content.slice(0, 24000),
      }),
    );
    return {
      sources,
      text: excerpts.join("\n"),
      warning:
        post.content.length > 24000
          ? "文章较长，本次仅参考前 24000 字符。"
          : undefined,
    };
  }
  if (!settings.ai_vector_search_enabled || !settings.ai_embedding_api_key)
    throw new Error("全站知识库尚未启用或配置");
  const query = input.messages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content)
    .join("\n")
    .slice(-6000);
  const vector = await generateQueryEmbedding(query, signal);
  signal.throwIfAborted();
  const results = await VectorRepository.search(query, vector, { limit: 5 });
  for (const result of results) {
    signal.throwIfAborted();
    const post = await PostRepository.getPostById(result.postId);
    if (!post || post.status !== "published") continue;
    sources.push({
      id: post.id,
      title: post.title,
      url: `/posts/${encodeURIComponent(post.slug)}`,
    });
    const words = query.toLowerCase().match(/[a-z0-9_]{2,}/g) || [];
    const chinese = query.match(/\p{Script=Han}{2,}/gu) || [];
    const terms = Array.from(
      new Set([
        ...words,
        ...chinese.flatMap((text) =>
          Array.from({ length: text.length - 1 }, (_, i) =>
            text.slice(i, i + 2),
          ),
        ),
      ]),
    ).slice(-200);
    const ranked = post.content
      .split(/\n\s*\n/)
      .flatMap((text) =>
        text.length <= 1200
          ? [text]
          : Array.from({ length: Math.ceil(text.length / 1000) }, (_, index) =>
              text.slice(index * 1000, index * 1000 + 1200),
            ),
      )
      .map((text, index) => ({
        text,
        index,
        score: terms.reduce(
          (score, term) => score + (text.toLowerCase().includes(term) ? 1 : 0),
          0,
        ),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    excerpts.push(
      JSON.stringify({
        title: post.title,
        url: sources[sources.length - 1].url,
        content: ranked
          .slice(0, 6)
          .sort((a, b) => a.index - b.index)
          .map((p) => p.text)
          .join("\n\n")
          .slice(0, 4500),
      }),
    );
  }
  return {
    sources,
    text: excerpts.join("\n"),
    warning: sources.length
      ? undefined
      : "没有找到足够相关的文章，请尝试补充关键词。",
  };
}
