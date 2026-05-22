/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 14: excluir módulos nativos del bundle de webpack
    serverComponentsExternalPackages: [
      '@tensorflow/tfjs-node',
      'canvas',
      '@vladmandic/face-api',
      '@mapbox/node-pre-gyp',
      'node-pre-gyp',
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) return config;
    const nativeExternals = ['nock', 'aws-sdk', 'mock-aws-s3', '@mapbox/node-pre-gyp'];
    nativeExternals.forEach(pkg => config.externals.push(pkg));
    return config;
  },
};

module.exports = nextConfig;
