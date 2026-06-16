/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
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
