import { listMediaFolder, deleteMediaFile as removeMediaFile } from '../media-library';
import { BaseRepository } from './BaseRepository';

export interface MediaFile {
  filename: string;
  url: string;
  size: number;
  uploadedAt: Date;
  modifiedAt: Date;
  extension: string;
}

export interface MediaPaginationResult {
  data: MediaFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MediaRepository extends BaseRepository {
  private static readonly ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

  static async getMediaFiles(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<MediaPaginationResult> {
    const { page = 1, limit = 20, search } = options;
    const listing = await listMediaFolder('');
    const images = listing.images.filter((image) => {
      if (search && !image.filename.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    const total = images.length;
    const offset = (page - 1) * limit;
    return {
      data: images.slice(offset, offset + limit).map((image) => ({
        filename: image.filename,
        url: image.url,
        size: image.size,
        uploadedAt: image.uploadedAt,
        modifiedAt: image.modifiedAt,
        extension: image.extension,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async deleteMediaFile(filename: string): Promise<boolean> {
    await removeMediaFile(`uploads/${filename.split(/[\\/]/).pop()}`);
    return true;
  }

  static getAllowedImageExtensions(): string[] {
    return [...this.ALLOWED_IMAGE_EXTENSIONS];
  }
}
