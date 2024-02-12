/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@divine-bridge/common'],
  webpack: (config) => {
    Object.assign(config.resolve.alias, {
      '@mongodb-js/zstd': false,
      '@aws-sdk/credential-providers': false,
      'snappy': false,
      'aws4': false,
      'mongodb-client-encryption': false,
      'kerberos': false,
      'supports-color': false,
    });
    return config;
  },
  images: {
    domains: ['cdn.discordapp.com', 'yt3.ggpht.com'],
  },
  async rewrites() {
    return [
      {
        source: '/server/:path*',
        destination: `${process.env.SERVER_URL}/server/:path*`,
      },
    ];
  },
};

export default nextConfig;
