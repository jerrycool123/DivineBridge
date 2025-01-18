import defaultConfig from '@divine-bridge/eslint-config-custom';
import { FlatCompat } from '@eslint/eslintrc';
import jest from 'eslint-plugin-jest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...defaultConfig,
  ...compat.extends('plugin:import-esm/recommended'),
  {
    files: ['test/**'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/prefer-expect-assertions': 'off',
    },
  },
  {
    ignores: ['dist/'],
  },
];
