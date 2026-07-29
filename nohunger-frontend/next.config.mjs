import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
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
  }
};
export default nextConfig;