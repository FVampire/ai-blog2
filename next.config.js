function cosPublicOrigin() {
  const explicit = (process.env.COS_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (explicit) return explicit;
  const bucket = (process.env.COS_BUCKET || '').trim();
  const region = (process.env.COS_REGION || '').trim();
  return bucket && region ? `https://${bucket}.cos.${region}.myqcloud.com` : '';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Case-study media lives on COS (scripts/upload-project-media-to-cos.mjs); empty means public/.
    NEXT_PUBLIC_PROJECT_MEDIA_ORIGIN: process.env.PROJECT_MEDIA_LOCAL === '1' ? '' : cosPublicOrigin(),
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blog-1304232496.cos.ap-shanghai.myqcloud.com',
      },
    ],
  },
  serverExternalPackages: ['@aws-sdk/client-s3'],
  // TypeORM imports all drivers; tell webpack to ignore the ones we don't need
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'expo-sqlite': false,
      'react-native-sqlite-storage': false,
      'cordova-sqlite-storage': false,
      'sqlite3': false,
      'mysql2': false,
      'oracledb': false,
      'mssql': false,
      'sap': false,
      'better-sqlite3': false,
      'sql.js': false,
      'mongodb': false,
      'ioredis': false,
      '@sap/hana-client': false,
      'hdb-pool': false,
    };
    return config;
  },
}

module.exports = nextConfig
