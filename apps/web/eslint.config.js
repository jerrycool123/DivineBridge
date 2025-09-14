import defaultConfig from '@divine-bridge/eslint-config-custom';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  ...defaultConfig,
  ...compat.config({
    extends: ['plugin:@next/next/recommended'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
    settings: {
      next: {
        rootDir: 'apps/web/',
      },
    },
  }),
];

export default config;

// {
//   "settings": {
//     "next": {
//       "rootDir": "apps/web/"
//     }
//   },
//   "rules": {
//     "@next/next/no-html-link-for-pages": "off"
//   },
//   "extends": ["@divine-bridge/eslint-config-custom", "next/core-web-vitals"],
//   "ignorePatterns": ["**/*.mjs"]
// }
