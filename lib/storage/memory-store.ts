import type { ListObjectsResult, MediaStore, StoredObject, StoredObjectMeta } from './types.ts';

interface MemoryRecord {
  body: Buffer;
  contentType: string;
  lastModified: Date;
}

function toMeta(key: string, record: MemoryRecord): StoredObjectMeta {
  return {
    key,
    size: record.body.length,
    lastModified: record.lastModified,
    contentType: record.contentType,
  };
}

export class MemoryMediaStore implements MediaStore {
  private readonly objects = new Map<string, MemoryRecord>();

  clear(): void {
    this.objects.clear();
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(key, {
      body: Buffer.from(body),
      contentType,
      lastModified: new Date(),
    });
  }

  async headObject(key: string): Promise<StoredObjectMeta | null> {
    const record = this.objects.get(key);
    return record ? toMeta(key, record) : null;
  }

  async getObject(key: string): Promise<StoredObject | null> {
    const record = this.objects.get(key);
    if (!record) return null;
    return { ...toMeta(key, record), body: Buffer.from(record.body) };
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async deleteObjects(keys: string[]): Promise<void> {
    for (const key of keys) this.objects.delete(key);
  }

  async copyObject(fromKey: string, toKey: string): Promise<void> {
    const record = this.objects.get(fromKey);
    if (!record) throw new Error(`源对象不存在: ${fromKey}`);
    this.objects.set(toKey, {
      body: Buffer.from(record.body),
      contentType: record.contentType,
      lastModified: new Date(),
    });
  }

  async list(prefix: string, delimiter?: string): Promise<ListObjectsResult> {
    const prefixes = new Set<string>();
    const objects: StoredObjectMeta[] = [];

    for (const [key, record] of this.objects) {
      if (!key.startsWith(prefix) || key === prefix) continue;
      if (delimiter) {
        const rest = key.slice(prefix.length);
        const delimIndex = rest.indexOf(delimiter);
        if (delimIndex >= 0) {
          prefixes.add(prefix + rest.slice(0, delimIndex + delimiter.length));
          continue;
        }
      }
      objects.push(toMeta(key, record));
    }

    return {
      prefixes: [...prefixes].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      objects,
    };
  }
}
