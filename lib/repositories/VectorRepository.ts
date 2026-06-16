/**
 * VectorRepository - 向量数据存储仓库
 * 管理文章Embedding向量的存储和搜索
 * 注意: pgvector 操作使用 raw SQL，TypeORM 不原生支持向量类型
 */

import { BaseRepository } from './BaseRepository';
import {
  EmbeddingVector,
  formatVectorForSQL,
  getSearchWeights,
  getSimilarityThreshold,
} from '../embedding';

// 搜索结果接口
export interface VectorSearchResult {
  postId: number;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl?: string;
  authorName?: string;
  publishedAt: Date;
  views: number;
  similarity: number;
  titleSimilarity: number;
  contentSimilarity: number;
  excerptSimilarity: number;
  matchedSnippets: string[];
}

export class VectorRepository extends BaseRepository {
  /**
   * 保存或更新文章的向量数据
   */
  static async saveVectors(
    postId: number,
    vectors: EmbeddingVector,
  ): Promise<void> {
    const ds = await this.getDataSource();
    await ds.query(
      `INSERT INTO post_vectors (post_id, content_vector, excerpt_vector, title_vector, embedding_model, updated_at)
       VALUES ($1, $2::vector, $3::vector, $4::vector, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (post_id)
       DO UPDATE SET
         content_vector = $2::vector,
         excerpt_vector = $3::vector,
         title_vector = $4::vector,
         embedding_model = $5,
         updated_at = CURRENT_TIMESTAMP`,
      [
        postId,
        formatVectorForSQL(vectors.content),
        formatVectorForSQL(vectors.excerpt),
        formatVectorForSQL(vectors.title),
        vectors.model,
      ],
    );
  }

  /**
   * 删除文章的向量数据
   */
  static async deleteVectors(postId: number): Promise<void> {
    const ds = await this.getDataSource();
    await ds.query('DELETE FROM post_vectors WHERE post_id = $1', [postId]);
  }

  /**
   * 获取文章的向量数据
   */
  static async getVectors(postId: number): Promise<EmbeddingVector | null> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      `SELECT content_vector, excerpt_vector, title_vector, embedding_model
       FROM post_vectors WHERE post_id = $1`,
      [postId],
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      content: this.parseVector(row.content_vector),
      excerpt: this.parseVector(row.excerpt_vector),
      title: this.parseVector(row.title_vector),
      model: row.embedding_model,
    };
  }

  /**
   * 解析PostgreSQL向量格式
   */
  private static parseVector(vectorStr: string | number[]): number[] {
    if (Array.isArray(vectorStr)) return vectorStr;
    if (typeof vectorStr === 'string') {
      return vectorStr
        .replace(/[[\]]/g, '')
        .split(',')
        .map((v) => parseFloat(v.trim()));
    }
    return [];
  }

  /**
   * 执行向量相似度搜索
   */
  static async searchByVector(
    queryVector: EmbeddingVector,
    options: {
      limit?: number;
      threshold?: number;
      weights?: { title: number; content: number; excerpt: number };
    } = {},
  ): Promise<VectorSearchResult[]> {
    const {
      limit = 10,
      threshold = await getSimilarityThreshold(),
      weights = await getSearchWeights(),
    } = options;

    const ds = await this.getDataSource();
    const rows = await ds.query(
      `SELECT
        p.id as post_id,
        p.title,
        p.slug,
        p.excerpt,
        p.image_url,
        p.published_at,
        p.views,
        u.username as author_name,
        pv.title_vector,
        pv.content_vector,
        pv.excerpt_vector,
        COALESCE(1 - (pv.title_vector <=> $1::vector), 0) as title_similarity,
        COALESCE(1 - (pv.content_vector <=> $2::vector), 0) as content_similarity,
        COALESCE(1 - (pv.excerpt_vector <=> $3::vector), 0) as excerpt_similarity
      FROM post_vectors pv
      JOIN posts p ON pv.post_id = p.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY (
        COALESCE(1 - (pv.title_vector <=> $1::vector), 0) * $5 +
        COALESCE(1 - (pv.content_vector <=> $2::vector), 0) * $6 +
        COALESCE(1 - (pv.excerpt_vector <=> $3::vector), 0) * $7
      ) DESC
      LIMIT $4`,
      [
        formatVectorForSQL(queryVector.title),
        formatVectorForSQL(queryVector.content),
        formatVectorForSQL(queryVector.excerpt),
        limit,
        weights.title,
        weights.content,
        weights.excerpt,
      ],
    );

    const results: VectorSearchResult[] = [];

    for (const row of rows) {
      const titleSim = row.title_similarity ?? 0;
      const contentSim = row.content_similarity ?? 0;
      const excerptSim = row.excerpt_similarity ?? 0;

      const weightedScore =
        titleSim * weights.title +
        contentSim * weights.content +
        excerptSim * weights.excerpt;

      if (weightedScore < threshold) continue;

      results.push({
        postId: row.post_id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        imageUrl: row.image_url,
        authorName: row.author_name,
        publishedAt: row.published_at,
        views: row.views,
        similarity: weightedScore,
        titleSimilarity: titleSim,
        contentSimilarity: contentSim,
        excerptSimilarity: excerptSim,
        matchedSnippets: this.extractMatchedSnippets(row.title, row.excerpt, titleSim, excerptSim),
      });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results;
  }

  /**
   * 执行向量搜索（带文本查询）
   */
  static async search(
    queryText: string,
    queryVectors: EmbeddingVector,
    options: {
      limit?: number;
      threshold?: number;
    } = {},
  ): Promise<VectorSearchResult[]> {
    const { limit = 10, threshold } = options;
    return await this.searchByVector(queryVectors, { limit, threshold });
  }

  /**
   * 获取没有向量的文章列表（用于批量生成）
   */
  static async getPostsWithoutVectors(limit: number = 100): Promise<
    { id: number; title: string; content: string; excerpt: string }[]
  > {
    const ds = await this.getDataSource();
    return await ds.query(
      `SELECT p.id, p.title, p.content, p.excerpt
       FROM posts p
       LEFT JOIN post_vectors pv ON p.id = pv.post_id
       WHERE pv.post_id IS NULL AND p.status = 'published'
       LIMIT $1`,
      [limit],
    );
  }

  /**
   * 检查文章是否已有向量
   */
  static async hasVectors(postId: number): Promise<boolean> {
    const ds = await this.getDataSource();
    const rows = await ds.query('SELECT 1 FROM post_vectors WHERE post_id = $1', [postId]);
    return rows.length > 0;
  }

  /**
   * 批量保存向量
   */
  static async batchSaveVectors(
    vectorsData: { postId: number; vectors: EmbeddingVector }[],
  ): Promise<void> {
    if (vectorsData.length === 0) return;

    const ds = await this.getDataSource();
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const { postId, vectors } of vectorsData) {
        await queryRunner.query(
          `INSERT INTO post_vectors (post_id, content_vector, excerpt_vector, title_vector, embedding_model, updated_at)
           VALUES ($1, $2::vector, $3::vector, $4::vector, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (post_id)
           DO UPDATE SET
             content_vector = $2::vector,
             excerpt_vector = $3::vector,
             title_vector = $4::vector,
             embedding_model = $5,
             updated_at = CURRENT_TIMESTAMP`,
          [
            postId,
            formatVectorForSQL(vectors.content),
            formatVectorForSQL(vectors.excerpt),
            formatVectorForSQL(vectors.title),
            vectors.model,
          ],
        );
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Batch save vectors error:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 提取匹配的文字片段
   */
  private static extractMatchedSnippets(
    title: string,
    excerpt: string,
    titleSim: number,
    excerptSim: number,
  ): string[] {
    const snippets: string[] = [];
    if (titleSim > 0.6) snippets.push(title);
    if (excerptSim > 0.5 && excerpt) {
      const maxLength = 150;
      if (excerpt.length > maxLength) {
        snippets.push(excerpt.substring(0, maxLength) + '...');
      } else {
        snippets.push(excerpt);
      }
    }
    return snippets;
  }

  /**
   * 获取文章向量统计信息
   */
  static async getStats(): Promise<{
    totalPosts: number;
    postsWithVectors: number;
    postsWithoutVectors: number;
  }> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT
        COUNT(DISTINCT p.id) as total_posts,
        COUNT(DISTINCT pv.post_id) as posts_with_vectors
      FROM posts p
      LEFT JOIN post_vectors pv ON p.id = pv.post_id
      WHERE p.status = 'published'
    `);

    const totalPosts = parseInt(rows[0].total_posts) || 0;
    const postsWithVectors = parseInt(rows[0].posts_with_vectors) || 0;

    return {
      totalPosts,
      postsWithVectors,
      postsWithoutVectors: totalPosts - postsWithVectors,
    };
  }
}
