/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
