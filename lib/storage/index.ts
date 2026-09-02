import { isCosConfigured } from './cos-config.ts';
import { CosMediaStore } from './cos-store.ts';
import { MemoryMediaStore } from './memory-store.ts';
import type { MediaStore } from './types.ts';

export { getCosConfig, getCosPublicBaseUrl, isCosConfigured } from './cos-config.ts';
export type { MediaStore, StoredObject, StoredObjectMeta } from './types.ts';

const memoryStore = new MemoryMediaStore();
let cosStore: CosMediaStore | null = null;

function inNodeTest(): boolean {
  return Boolean(process.env.NODE_TEST_CONTEXT);
}

export function getMediaStore(): MediaStore {
  if (inNodeTest()) return memoryStore;
  if (!isCosConfigured()) {
    throw new Error('未配置腾讯云 COS。请在 .env 中设置 COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET、COS_REGION');
  }
  if (!cosStore) cosStore = new CosMediaStore();
  return cosStore;
}

export function resetMediaStoreForTests(): void {
  memoryStore.clear();
  cosStore = null;
}
