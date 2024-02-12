import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src'],
  outDir: './dist',
  format: ['esm'],
  esbuildOptions(options) {
    options.bundle = false;
  },
});
