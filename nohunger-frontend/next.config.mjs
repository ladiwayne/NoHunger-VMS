import { imageHosts } from './image-hosts.config.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, 'src');

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  // distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    qualities: [75, 85],
    remotePatterns: imageHosts,
  },



  async redirects() {
    return [
      {
        source: '/',
        destination: '/sign-up-login-screen',
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': srcDir,
    };
    return config;
  },
};
export default nextConfig;