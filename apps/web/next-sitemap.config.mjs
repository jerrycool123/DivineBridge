/** @type {import('next-sitemap').IConfig} */
const sitemapConfig = {
  siteUrl:
    process.env.AUTH_URL ??
    (() => {
      throw new Error('Missing AUTH_URL env var');
    }),
  generateRobotsTxt: true,
  exclude: ['/dashboard*'],
};

export default sitemapConfig;
