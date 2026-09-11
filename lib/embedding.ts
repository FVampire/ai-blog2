/**
 * Embedding Service - 文本向量化服务
 * 用于生成文章内容的向量表示，支持向量搜索
 */
import { requestScope } from "./ai/abort";

// 向量维度
export const VECTOR_DIMENSION = 1024;

// Embedding模型配置接口
interface EmbeddingConfig {
  provider: "openai" | "anthropic" | "deepseek" | string;
  apiKey: string;
  apiBaseUrl?: string;
  model: string;
  dimensions: number;
}

// 向量数据接口
export interface EmbeddingVector {
  content: number[];
  excerpt: number[];
  title: number[];
  model: string;
}

// 搜索权重配置
interface SearchWeights {
  title: number;
  content: number;
  excerpt: number;
}

/**
 * 获取Embedding配置
 */
export async function getEmbeddingConfig(): Promise<EmbeddingConfig | null> {
  try {
    const { query } = await import("./db");

    // 从数据库获取配置
    const { rows } = await query(
      "SELECT key, value FROM settings WHERE key LIKE 'ai_embedding_%'",
    );

    const config: Record<string, string> = {};
    rows.forEach((row: any) => {
      config[row.key] = row.value;
    });

    if (!config["ai_embedding_api_key"]) {
      console.warn("Embedding API key not configured");
      return null;
    }

    return {
      provider: config["ai_embedding_provider"] || "openai",
      apiKey: config["ai_embedding_api_key"],
      apiBaseUrl: config["ai_embedding_api_base_url"],
      model: config["ai_embedding_model"] || "bge-m3",
      dimensions:
        parseInt(config["ai_embedding_dimensions"]) || VECTOR_DIMENSION,
    };
  } catch (error) {
    console.error("Failed to get embedding config:", error);
    return null;
  }
}

/**
 * 获取搜索权重配置
 */
export async function getSearchWeights(): Promise<SearchWeights> {
  try {
    const { query } = await import("./db");
    const { rows } = await query(
      "SELECT key, value FROM settings WHERE key LIKE 'ai_vector_search_weight_%'",
    );

    const weights: Record<string, number> = {};
    rows.forEach((row: any) => {
      weights[row.key] = parseFloat(row.value) || 0;
    });

    return {
      title: weights["ai_vector_search_weight_title"] ?? 0.3,
      content: weights["ai_vector_search_weight_content"] ?? 0.5,
      excerpt: weights["ai_vector_search_weight_excerpt"] ?? 0.2,
    };
  } catch (error) {
    console.error("Failed to get search weights:", error);
    return { title: 0.3, content: 0.5, excerpt: 0.2 };
  }
}

/**
 * 获取相似度阈值
 */
export async function getSimilarityThreshold(): Promise<number> {
  try {
    const { query } = await import("./db");
    const { rows } = await query(
      "SELECT value FROM settings WHERE key = 'ai_vector_search_threshold'",
    );

    if (rows.length > 0) {
      const value = Number(rows[0].value);
      return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.7;
    }
    return 0.7;
  } catch (error) {
    console.error("Failed to get similarity threshold:", error);
    return 0.7;
  }
}

/**
 * 生成单个文本的Embedding向量
 */
async function generateSingleEmbedding(
  text: string,
  config: EmbeddingConfig,
  signal?: AbortSignal,
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    // 返回零向量
    return new Array(VECTOR_DIMENSION).fill(0);
  }

  return (await requestEmbeddings([text], config, signal))[0];
}

async function requestEmbeddings(
  input: string[],
  config: EmbeddingConfig,
  signal?: AbortSignal,
): Promise<number[][]> {
  const scope = requestScope(signal, 20000);
  try {
    const response = await fetch(
      `${(config.apiBaseUrl || "https://api.openai.com/v1").replace(/\/$/, "")}/embeddings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          input,
          encoding_format: "float",
          dimensions: config.dimensions,
        }),
        signal: scope.signal,
      },
    );
    if (!response.ok) throw new Error(`向量服务不可用（${response.status}）`);
    const result = await response.json();
    if (!Array.isArray(result.data) || result.data.length !== input.length)
      throw new Error("向量服务响应无效");
    const entries = result.data as { index: number; embedding: number[] }[];
    entries.sort((a, b) => a.index - b.index);
    if (
      entries.some(
        (entry, index) =>
          entry.index !== index ||
          !Array.isArray(entry.embedding) ||
          entry.embedding.length !== VECTOR_DIMENSION ||
          entry.embedding.some((n) => !Number.isFinite(n)),
      )
    )
      throw new Error("向量维度必须为 1024，请检查模型与索引配置");
    return entries.map((entry) => entry.embedding);
  } finally {
    scope.dispose();
  }
}

/** A search query needs only one embedding, reused for the three indexed fields. */
export async function generateQueryEmbedding(
  text: string,
  signal?: AbortSignal,
): Promise<EmbeddingVector> {
  const config = await getEmbeddingConfig();
  if (!config) throw new Error("知识库尚未配置");
  const vector = await generateSingleEmbedding(text, config, signal);
  return {
    title: vector,
    content: vector,
    excerpt: vector,
    model: config.model,
  };
}

/**
 * 生成文章的Embedding向量
 * @param title 文章标题
 * @param content 文章内容
 * @param excerpt 文章摘要
 */
export async function generateEmbedding(
  title: string,
  content: string,
  excerpt?: string,
): Promise<EmbeddingVector | null> {
  const config = await getEmbeddingConfig();
  if (!config) {
    console.warn("Embedding not configured, skipping vector generation");
    return null;
  }

  try {
    // 并行生成三个部分的向量
    const [titleVector, contentVector, excerptVector] = await Promise.all([
      generateSingleEmbedding(title, config),
      generateSingleEmbedding(content, config),
      generateSingleEmbedding(excerpt || "", config),
    ]);

    return {
      title: titleVector,
      content: contentVector,
      excerpt: excerptVector,
      model: config.model,
    };
  } catch (error) {
    console.error("Failed to generate embeddings:", error);
    return null;
  }
}

/**
 * 批量生成Embedding向量
 * @param texts 文本数组
 */
export async function generateBatchEmbeddings(
  texts: string[],
): Promise<number[][] | null> {
  const config = await getEmbeddingConfig();
  if (!config) {
    console.warn("Embedding not configured, skipping batch vector generation");
    return null;
  }

  // 过滤空文本
  const validTexts = texts.filter((t) => t && t.trim().length > 0);
  if (validTexts.length === 0) {
    return texts.map(() => new Array(VECTOR_DIMENSION).fill(0));
  }

  try {
    const embeddings = await requestEmbeddings(validTexts, config);

    // 如果有空文本，补充零向量
    const result: number[][] = [];
    let embeddingIndex = 0;
    for (const text of texts) {
      if (!text || text.trim().length === 0) {
        result.push(new Array(VECTOR_DIMENSION).fill(0));
      } else {
        result.push(embeddings[embeddingIndex++]);
      }
    }

    return result;
  } catch (error: any) {
    console.error("OpenAI batch embedding error:", error.message);
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
}

/**
 * 计算余弦相似度
 * @param vec1 向量1
 * @param vec2 向量2
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same dimension");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * 计算加权相似度得分
 * @param queryVec 查询向量
 * @param titleVec 标题向量
 * @param contentVec 内容向量
 * @param excerptVec 摘要向量
 * @param weights 权重配置
 */
export function calculateWeightedScore(
  queryVec: number[],
  titleVec: number[],
  contentVec: number[],
  excerptVec: number[],
  weights: SearchWeights,
): number {
  const titleSim = cosineSimilarity(queryVec, titleVec);
  const contentSim = cosineSimilarity(queryVec, contentVec);
  const excerptSim = cosineSimilarity(queryVec, excerptVec);

  return (
    titleSim * weights.title +
    contentSim * weights.content +
    excerptSim * weights.excerpt
  );
}

/**
 * 格式化向量用于SQL查询
 * @param vector 向量数组
 */
export function formatVectorForSQL(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
