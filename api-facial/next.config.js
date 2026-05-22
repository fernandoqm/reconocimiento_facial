/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@tensorflow/tfjs-node',
    'canvas',
    '@vladmandic/face-api',
    '@mapbox/node-pre-gyp',
    'node-pre-gyp',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) return config;
    // Evita que webpack trate de bundlear dependencias nativas de TF y canvas
    const nativeExternals = ['nock', 'aws-sdk', 'mock-aws-s3', '@mapbox/node-pre-gyp'];
    nativeExternals.forEach(pkg => config.externals.push(pkg));
    return config;
  },
};

module.exports = nextConfig;
