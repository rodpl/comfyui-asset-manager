import js from '@eslint/js';
import prettierConfig from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';





export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      prettierConfig
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          semi: true,
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 100,
          bracketSpacing: true,
          endOfLine: 'lf',
          tabWidith: 2,
          importOrder: [
            '^@core/(.*)$',
            '<THIRD_PARTY_MODULES>',
            '^@/(.*)$',
            '^[./]'
          ],
          importOrderSeparation: true,
          importOrderSortSpecifiers: true,
          overrides: [
            {
              files: '*.{js,cjs,mjs,ts,cts,mts,tsx,vue}',
              options: {
                plugins: ['@trivago/prettier-plugin-sort-imports']
              }
            }
          ]
        }
      ]
    }
  }
])