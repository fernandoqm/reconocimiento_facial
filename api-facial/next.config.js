/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling native modules — use the system binaries
  serverExternalPackages: ['@tensorflow/tfjs-node', 'canvas', '@vladmandic/face-api'],
};

module.exports = nextConfig;
