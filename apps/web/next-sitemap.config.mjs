/** @type {import('next-sitemap').IConfig} */
const sitemapConfig = {
  siteUrl: process.env.NEXT_PUBLIC_WEB_URL ?? '',
  generateRobotsTxt: true,
  exclude: ['/dashboard*'],
};

export default sitemapConfig;
