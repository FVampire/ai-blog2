import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { getCosConfig, type CosConfig } from './cos-config.ts';
import type { ListObjectsResult, MediaStore, StoredObject, StoredObjectMeta } from './types.ts';

function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = Number((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode);
  const name = String((error as { name?: string }).name || '');
  const code = String((error as { Code?: string }).Code || '');
  return status === 404 || name === 'NotFound' || name === 'NoSuchKey' || code === 'NoSuchKey' || code === '404';
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === 'object' && body && 'transformToByteArray' in body && typeof (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
    return Buffer.from(await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray());
  }
  throw new Error('无法读取对象内容');
}

export class CosMediaStore implements MediaStore {
  private readonly client: S3Client;
  private readonly config: CosConfig;

  constructor(config = getCosConfig()) {
    if (!config) throw new Error('未配置腾讯云 COS');
    this.config = config;
    this.client = new S3Client({
      region: config.region,
      endpoint: `https://cos.${config.region}.myqcloud.com`,
      credentials: {
        accessKeyId: config.secretId,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: false,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  private acl() {
    return this.config.objectAcl ? { ACL: this.config.objectAcl } : {};
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: key.endsWith('/') ? undefined : 'public, max-age=31536000, immutable',
      ...this.acl(),
    }));
  }

  async headObject(key: string): Promise<StoredObjectMeta | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }));
      return {
        key,
        size: Number(result.ContentLength || 0),
        lastModified: result.LastModified || new Date(),
        contentType: result.ContentType,
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async getObject(key: string): Promise<StoredObject | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }));
      const body = await bodyToBuffer(result.Body);
      return {
        key,
        body,
        size: body.length,
        lastModified: result.LastModified || new Date(),
        contentType: result.ContentType,
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    }));
  }

  async deleteObjects(keys: string[]): Promise<void> {
    for (let index = 0; index < keys.length; index += 1000) {
      const chunk = keys.slice(index, index + 1000);
      if (chunk.length === 0) continue;
      await this.client.send(new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }));
    }
  }

  async copyObject(fromKey: string, toKey: string): Promise<void> {
    await this.client.send(new CopyObjectCommand({
      Bucket: this.config.bucket,
      Key: toKey,
      CopySource: `${this.config.bucket}/${encodeKey(fromKey)}`,
      MetadataDirective: 'COPY',
      ...this.acl(),
    }));
  }

  async list(prefix: string, delimiter?: string): Promise<ListObjectsResult> {
    const prefixes = new Set<string>();
    const objects: StoredObjectMeta[] = [];
    let token: string | undefined;

    do {
      const result = await this.client.send(new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        Delimiter: delimiter,
        ContinuationToken: token,
        MaxKeys: 1000,
      }));

      for (const item of result.CommonPrefixes || []) {
        if (item.Prefix) prefixes.add(item.Prefix);
      }
      for (const item of result.Contents || []) {
        if (!item.Key || item.Key === prefix) continue;
        objects.push({
          key: item.Key,
          size: Number(item.Size || 0),
          lastModified: item.LastModified || new Date(),
        });
      }
      token = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (token);

    return {
      prefixes: [...prefixes].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      objects,
    };
  }
}
