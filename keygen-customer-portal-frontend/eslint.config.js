/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T02:43:14
 * Last Updated: 2025-12-20T22:05:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      'build/**',
      'out/**',
      '.angular/**',
      'node_modules/**',
      'coverage/**',
      'documentation/**',
      '*.log',
      'angular.json',
    ],
  },
  // Сначала специфические правила (они имеют больший приоритет)
  {
    files: ['**/*.spec.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // any допустим в тестах
      '@typescript-eslint/no-unused-vars': 'off', // неиспользуемые переменные в тестах норм
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/no-empty-lifecycle-method': 'off',
    },
  },

  // Override для UI библиотек - более мягкие правила
  {
    files: ['libs/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'warn', // Предупреждение вместо ошибки
        {
          type: 'attribute',
          prefix: ['app', 'hlm'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'warn', // Предупреждение вместо ошибки
        {
          type: 'element',
          prefix: ['app', 'hlm'],
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/no-input-rename': 'off', // Разрешаем алиасы в UI компонентах
      '@angular-eslint/no-output-rename': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn', // Только предупреждение для libs
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@angular-eslint/prefer-inject': 'off', // Отключаем для UI libs
      '@angular-eslint/no-empty-lifecycle-method': 'off',
    },
  },

  // Override для shared компонентов - чуть мягче чем app
  {
    files: ['src/app/shared/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/prefer-inject': 'off', // Пока не мигрируем
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Базовые правила для всех остальных TypeScript файлов
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': 'off', // Отключаем для совместимости
      '@angular-eslint/component-selector': 'off', // Отключаем для совместимости
      '@typescript-eslint/no-unused-vars': 'off', // Отключаем для совместимости
      '@typescript-eslint/no-explicit-any': 'off', // Отключаем для совместимости
      '@angular-eslint/prefer-inject': 'off', // Отключаем для совместимости
      '@angular-eslint/no-empty-lifecycle-method': 'off', // Отключаем для совместимости
      '@angular-eslint/no-input-rename': 'off', // Отключаем для совместимости
      '@angular-eslint/no-output-rename': 'off', // Отключаем для совместимости
      '@typescript-eslint/ban-ts-comment': 'off', // Отключаем для совместимости с @ts-ignore
    },
  },

  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
