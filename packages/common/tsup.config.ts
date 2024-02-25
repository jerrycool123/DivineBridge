import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts'],
  outDir: './dist',
  inject: ['./cjs-shim.ts'],
  format: ['esm'],
});
