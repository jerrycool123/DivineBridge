/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@divine-bridge/common'],
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
