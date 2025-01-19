import defaultConfig from '@divine-bridge/eslint-config-custom';
import { FlatCompat } from '@eslint/eslintrc';
import jest from 'eslint-plugin-jest';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
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
