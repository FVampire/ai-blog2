// Uploads case-study media (videos, screenshots, renders) from public/projects to COS,
// keeping the same relative key so `/projects/...` paths map 1:1 onto the bucket.
// Usage: node scripts/upload-project-media-to-cos.mjs [--dry-run]
// Credentials come from .env / process env only (COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION).
import { config } from 'dotenv';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { PROJECT_MEDIA_DIRS } from './project-media-dirs.mjs';

config();

const CONTENT_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const dryRun = process.argv.includes('--dry-run');
const publicRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
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

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error?.code === 'ENOENT') return [];
    throw error;
  });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

async function remoteSize(key) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return Number(head.ContentLength);
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) return -1;
    throw error;
  }
}

let uploaded = 0;
let skipped = 0;
for (const dir of PROJECT_MEDIA_DIRS) {
  for (const absolute of await walk(path.join(publicRoot, dir))) {
    const key = path.relative(publicRoot, absolute).split(path.sep).join('/');
    const extension = path.extname(absolute).toLowerCase();
    const contentType = CONTENT_TYPES[extension];
    if (!contentType) continue;
    const info = await stat(absolute);
    if (await remoteSize(key) === info.size) {
      skipped += 1;
      continue;
    }
    if (dryRun) {
      console.log(`would upload ${key} (${info.size} bytes)`);
      continue;
    }
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(absolute),
      ContentType: contentType,
      ContentLength: info.size,
      // Paths are versioned (shots-rN / video-rN), so objects never change in place.
      CacheControl: 'public, max-age=31536000, immutable',
      ...(acl === 'none' || acl === 'private' ? {} : { ACL: 'public-read' }),
    }));
    uploaded += 1;
    console.log(`uploaded ${key}`);
  }
}

console.log(`${dryRun ? '预览' : '完成'}：上传 ${uploaded}，已存在跳过 ${skipped}`);
