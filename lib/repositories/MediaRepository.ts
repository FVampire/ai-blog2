import { NextRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { BaseRepository } from './BaseRepository';

// 媒体文件接口
export interface MediaFile {
  filename: string;
  url: string;
  size: number;
  uploadedAt: Date;
  modifiedAt: Date;
  extension: string;
}

// 分页结果接口
export interface MediaPaginationResult {
  data: MediaFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MediaRepository extends BaseRepository {
  private static readonly UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
  private static readonly ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  private static readonly ALLOWED_FILE_EXTENSIONS = [
    ...MediaRepository.ALLOWED_IMAGE_EXTENSIONS,
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip', '.rar'
  ];

  /**
   * 获取上传目录路径
   */
  private static getUploadsDir(): string {
    return this.UPLOADS_DIR;
  }

  /**
   * 确保上传目录存在
   */
  private static async ensureUploadsDir(): Promise<void> {
    const uploadsDir = this.getUploadsDir();
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }

  /**
   * 安全地处理文件名，防止路径遍历攻击
   */
  private static sanitizeFilename(filename: string): string {
    // 移除路径遍历字符并获取基本文件名
    return path.basename(filename);
  }

  /**
   * 检查文件扩展名是否允许
   */
  private static isAllowedExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
  }

  /**
   * 获取媒体文件列表
   */
  static async getMediaFiles(options: {
    page?: number;
    limit?: number;
    search?: string;
    request?: NextRequest;
    response?: NextApiResponse;
  } = {}): Promise<MediaPaginationResult> {
    const { page = 1, limit = 20, search } = options;

    try {
      // 确保上传目录存在
      await this.ensureUploadsDir();
      const uploadsDir = this.getUploadsDir();

      // 读取目录中的所有文件
      const files = fs.readdirSync(uploadsDir);

      // 过滤文件并获取文件信息
      let mediaFiles = files
        .filter(file => {
          // 检查是否为允许的文件类型
          if (!this.isAllowedExtension(file)) {
            return false;
          }

          // 如果有搜索条件，检查文件名是否匹配
          if (search && !file.toLowerCase().includes(search.toLowerCase())) {
            return false;
          }

          return true;
        })
        .map(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          const ext = path.extname(file).toLowerCase();

          return {
            filename: file,
            url: `/uploads/${file}`,
            size: stats.size,
            uploadedAt: stats.birthtime,
            modifiedAt: stats.mtime,
            extension: ext
          };
        })
        .sort((a, b) => {
          // 按上传时间倒序排列
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        });

      // 计算分页
      const total = mediaFiles.length;
      const offset = (page - 1) * limit;
      mediaFiles = mediaFiles.slice(offset, offset + limit);

      return {
        data: mediaFiles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Get media files error:', error);
      throw new Error(`获取媒体文件列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除媒体文件
   */
  static async deleteMediaFile(filename: string, request?: NextRequest, response?: NextApiResponse): Promise<boolean> {
    try {
      // 安全检查：防止路径遍历攻击
      const safeFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.getUploadsDir(), safeFilename);

      // 确保上传目录存在
      await this.ensureUploadsDir();

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在');
      }

      // 检查文件是否在上传目录中（额外的安全检查）
      const uploadsDir = this.getUploadsDir();
      const relativePath = path.relative(uploadsDir, filePath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('非法文件路径');
      }

      // 删除文件
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error('Delete media file error:', error);
      throw new Error(`删除媒体文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取媒体文件信息
   */
  static async getMediaFileInfo(filename: string, request?: NextRequest, response?: NextApiResponse): Promise<MediaFile | null> {
    try {
      // 安全检查：防止路径遍历攻击
      const safeFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.getUploadsDir(), safeFilename);

      // 确保上传目录存在
      await this.ensureUploadsDir();

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return null;
      }

      // 检查文件是否在上传目录中（额外的安全检查）
      const uploadsDir = this.getUploadsDir();
      const relativePath = path.relative(uploadsDir, filePath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('非法文件路径');
      }

      // 获取文件信息
      const stats = fs.statSync(filePath);
      const ext = path.extname(safeFilename).toLowerCase();

      return {
        filename: safeFilename,
        url: `/uploads/${safeFilename}`,
        size: stats.size,
        uploadedAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension: ext
      };
    } catch (error) {
      console.error('Get media file info error:', error);
      throw new Error(`获取媒体文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查文件是否存在
   */
  static async mediaFileExists(filename: string, request?: NextRequest, response?: NextApiResponse): Promise<boolean> {
    try {
      const safeFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.getUploadsDir(), safeFilename);

      // 确保上传目录存在
      await this.ensureUploadsDir();

      return fs.existsSync(filePath);
    } catch (error) {
      console.error('Check media file exists error:', error);
      return false;
    }
  }

  /**
   * 获取允许的文件扩展名列表
   */
  static getAllowedExtensions(): string[] {
    return [...this.ALLOWED_FILE_EXTENSIONS];
  }

  /**
   * 获取允许的图片扩展名列表
   */
  static getAllowedImageExtensions(): string[] {
    return [...this.ALLOWED_IMAGE_EXTENSIONS];
  }
}