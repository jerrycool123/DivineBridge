/** @type {import('next-sitemap').IConfig} */
const sitemapConfig = {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  siteUrl: process.env.AUTH_URL ?? '',
  generateRobotsTxt: true,
  exclude: ['/dashboard*'],
};

export default sitemapConfig;
