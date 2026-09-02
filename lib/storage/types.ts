export interface StoredObjectMeta {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export interface StoredObject extends StoredObjectMeta {
  body: Buffer;
}

export interface ListObjectsResult {
  prefixes: string[];
  objects: StoredObjectMeta[];
}

export interface MediaStore {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  headObject(key: string): Promise<StoredObjectMeta | null>;
  getObject(key: string): Promise<StoredObject | null>;
  deleteObject(key: string): Promise<void>;
  deleteObjects(keys: string[]): Promise<void>;
  copyObject(fromKey: string, toKey: string): Promise<void>;
  list(prefix: string, delimiter?: string): Promise<ListObjectsResult>;
}
