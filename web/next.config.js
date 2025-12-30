/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '**.mypinata.cloud',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle node.js modules that don't work in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        // Handle React Native modules that MetaMask SDK tries to import
        'react-native': false,
      };
    }

    // Externalize problematic modules
    config.externals.push('pino-pretty', 'encoding');

    // Ignore React Native async storage (used by MetaMask SDK but not needed in browser)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    return config;
  },
  // Transpile specific packages that need it
  transpilePackages: ['@rainbow-me/rainbowkit'],
};

module.exports = nextConfig;
