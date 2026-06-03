/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  // Production에서만 적용
  ...(process.env.ANALYZE === "true"
    ? {
        webpack: (config) => {
          const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
          config.plugins.push(new BundleAnalyzerPlugin());
          return config;
        },
      }
    : {}),
};

module.exports = nextConfig;
