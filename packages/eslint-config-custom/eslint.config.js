import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboConfig from 'eslint-config-turbo/flat';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { config as tsEslintConfig, configs as tsEslintConfigs } from 'typescript-eslint';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tsEslintConfig(
  ...turboConfig,
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  eslintConfigPrettier,
  ...compat.extends('plugin:import/typescript'),
  tsEslintConfigs.strictTypeChecked,
  tsEslintConfigs.stylisticTypeChecked,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,d.ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'eqeqeq': ['error', 'always'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableEnum: false,
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/require-await': 'off',
      'prettier/prettier': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
);

// export default [
//   {
//     ignores: ['**/build/**/*', '**/dist/**/*', '**/node_modules/**/*'],
//   },
//   ...compat.extends(
//     'turbo',
//     'eslint:recommended',
//     'plugin:@typescript-eslint/recommended',
//     'plugin:@typescript-eslint/recommended-requiring-type-checking',
//     'plugin:prettier/recommended',
//   ),
//   {
//     plugins: {
//       '@typescript-eslint': typescriptEslint,
//       'import': fixupPluginRules(_import),
//       prettier,
//     },
//     languageOptions: {
//       globals: {
//         ...globals.node,
//       },
//       parser: tsParser,
//       ecmaVersion: 'latest',
//       sourceType: 'module',

//       parserOptions: {
//         project: true,
//         tsconfigRootDir: '../../',
//       },
//     },
//     rules: {
//       'eqeqeq': ['error', 'always'],
//       '@typescript-eslint/no-explicit-any': 'error',
//       '@typescript-eslint/no-unused-vars': [
//         'error',
//         {
//           argsIgnorePattern: '^_',
//         },
//       ],
//       '@typescript-eslint/no-namespace': 'off',
//       '@typescript-eslint/strict-boolean-expressions': [
//         'error',
//         {
//           allowString: false,
//           allowNumber: false,
//           allowNullableObject: false,
//           allowNullableEnum: false,
//         },
//       ],
//       '@typescript-eslint/no-misused-promises': [
//         'error',
//         {
//           checksVoidReturn: false,
//         },
//       ],
//       '@typescript-eslint/require-await': 'off',
//       'prettier/prettier': 'error',
//     },
//   },
// ];
