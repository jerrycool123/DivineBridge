declare module 'eslint-config-turbo/flat' {
  import { Linter } from 'eslint';

  const turboConfig: Linter.Config[];

  export default turboConfig;
}

declare module '@divine-bridge/eslint-config-custom' {
  import type { TSESLint } from '@typescript-eslint/utils';

  const config: TSESLint.FlatConfig.ConfigArray;

  export default config;
}
