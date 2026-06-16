/**
 * 核心类型定义
 * 统一项目中使用的类型，消除 any
 */

// ==================== 数据库相关类型 ====================

export interface DatabaseRow {
  [key: string]: unknown;
}

export interface QueryResult<T = DatabaseRow> {
  rows: T[];
  rowCount: number;
}

// ==================== 用户相关类型 ====================

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  role?: string;
  avatar?: string;
  bio?: string;
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  avatar?: string;
  bio?: string;
}

// ==================== 文章相关类型 ====================

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  status: 'published' | 'draft' | 'archived';
  authorId: number;
  authorName?: string;
  prevPostId?: number;
  nextPostId?: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  tags?: Tag[];
}

export interface PostCreateInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  status?: string;
  authorId?: number;
  prevPostId?: number | null;
  nextPostId?: number | null;
  tagIds?: number[];
}

export interface PostUpdateInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  status?: string;
  prevPostId?: number | null;
  nextPostId?: number | null;
  tagIds?: number[];
}

// ==================== 标签相关类型 ====================

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount?: number;
  createdAt?: string;
}

export interface TagCreateInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface TagUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
}

// ==================== 评论相关类型 ====================

export interface Comment {
  id: number;
  postId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateInput {
  postId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId?: number;
}

// ==================== 设置相关类型 ====================

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logo?: string;
  favicon?: string;
  socialLinks?: SocialLink[];
  analyticsId?: string;
  seoDefaults?: SEODefaults;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface SEODefaults {
  titleTemplate: string;
  defaultDescription: string;
  defaultImage?: string;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ==================== 分页类型 ====================

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ==================== AI 相关类型 ====================

export interface AIConfig {
  id: number;
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

// ==================== MCP 相关类型 ====================

export interface MCPServer {
  id: number;
  name: string;
  command: string;
  args?: string;
  env?: Record<string, string>;
  enabled: boolean;
  createdAt: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

// ==================== 媒体相关类型 ====================

export interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  createdAt: string;
}

// ==================== 搜索相关类型 ====================

export interface SearchResult {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  score: number;
}

export interface VectorSearchResult {
  postId: number;
  title: string;
  similarity: number;
}

// ==================== 通用工具类型 ====================

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ID = number | string;

export type Timestamp = string | Date;

// 用于替代 any 的通用类型
export type UnknownRecord = Record<string, unknown>;

export type UnknownArray = unknown[];
