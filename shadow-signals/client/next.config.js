/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://shadow-signals-production.up.railway.app/api',
    NEXT_PUBLIC_WS_URL:  process.env.NEXT_PUBLIC_WS_URL  || 'https://shadow-signals-production.up.railway.app',
  },
};

module.exports = nextConfig;
