/** @type {import('esbuild').BuildOptions} */
export default () => ({
  bundle: true,
  minify: true,
  format: 'esm',
  outExtension: {
    '.js': '.mjs',
  },
  inject: ['./cjs-shim.ts'],
});
