import { config } from 'dotenv';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

config();

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
};

const defaultRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'uploads');
const root = path.resolve(process.argv[2] || defaultRoot);
const secretId = process.env.COS_SECRET_ID?.trim();
const secretKey = process.env.COS_SECRET_KEY?.trim();
const bucket = process.env.COS_BUCKET?.trim();
const region = process.env.COS_REGION?.trim();
const acl = (process.env.COS_OBJECT_ACL || 'public-read').trim().toLowerCase();

if (!secretId || !secretKey || !bucket || !region) {
  console.error('缺少 COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION');
  process.exit(1);
}

const client = new S3Client({
  region,
  endpoint: `https://cos.${region}.myqcloud.com`,
  credentials: { accessKeyId: secretId, secretAccessKey: secretKey },
  forcePathStyle: false,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

async function walk(directory, prefix) {
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const absolute = path.join(directory, entry.name);
    const key = `${prefix}/${entry.name}`.replaceAll('\\', '/');
    if (entry.isDirectory()) {
      files.push(...await walk(absolute, key));
      continue;
    }
    if (!entry.isFile()) continue;
    files.push({ absolute, key });
  }
  return files;
}

const files = await walk(root, 'uploads');
if (files.length === 0) {
  console.log(`没有找到本地文件：${root}`);
  process.exit(0);
}

let uploaded = 0;
for (const file of files) {
  const extension = path.extname(file.absolute).toLowerCase();
  const info = await stat(file.absolute);
  const extra = acl === 'none' || acl === 'private' ? {} : { ACL: 'public-read' };
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: file.key,
    Body: createReadStream(file.absolute),
    ContentType: CONTENT_TYPES[extension] || 'application/octet-stream',
    ContentLength: info.size,
    CacheControl: 'public, max-age=31536000, immutable',
    ...extra,
  }));
  uploaded += 1;
  console.log(`uploaded ${file.key}`);
}

console.log(`完成，共 ${uploaded} 个文件`);
