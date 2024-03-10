/** @type {import('esbuild').BuildOptions} */
const config = {
  bundle: true,
  minify: true,
  format: 'esm',
  outExtension: {
    '.js': '.mjs',
  },
  inject: ['./cjs-shim.ts'],
};

module.exports = () => config;
