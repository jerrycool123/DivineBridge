import defaultConfig from '@divine-bridge/eslint-config-custom';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  ...defaultConfig,
  ...compat.extends('plugin:import-esm/recommended'),
  {
    ignores: ['dist/'],
  },
];
