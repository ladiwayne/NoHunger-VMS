import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: imageHosts,
  },

  turbopack: {
    root: 'C:\\Users\\Dell Precision\\Desktop\\App Build\\NoHunger VMS',
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/sign-up-login-screen',
        permanent: false,
      },
    ];
  }
};
export default nextConfig;