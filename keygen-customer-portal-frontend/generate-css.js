#!/usr/bin/env node
/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-19T10:03:34
 * Last Updated: 2025-12-20T22:05:57
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * CSS Generation Script
 * Автоматическая генерация CSS из Tailwind классов
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0] || 'help';

const commands = {
  generate: 'css:generate',
  purge: 'css:purge',
  watch: 'css:generate:watch',
  'purge-watch': 'css:purge:watch',
  minify: 'css:generate:min',
  'purge-minify': 'css:purge:min',
};

function showHelp() {
  console.log(`
🎨 Tailwind CSS Generator

Использование: node generate-css.js [command]

Команды:
  generate     - Генерировать полный CSS
  purge        - Генерировать CSS только с используемыми классами
  watch        - Генерировать с отслеживанием изменений
  purge-watch  - Генерировать с очисткой и отслеживанием
  minify       - Генерировать минифицированный CSS
  purge-minify - Генерировать минифицированный CSS с очисткой

Примеры:
  node generate-css.js generate
  node generate-css.js purge-watch
  node generate-css.js minify
`);
}

function runCommand(cmd) {
  const npmCmd = commands[cmd];
  if (!npmCmd) {
    console.error(`❌ Неизвестная команда: ${cmd}`);
    showHelp();
    process.exit(1);
  }

  console.log(`🚀 Запуск: npm run ${npmCmd}`);
  try {
    execSync(`npm run ${npmCmd}`, { stdio: 'inherit' });
    console.log(`✅ Команда ${cmd} выполнена успешно`);
  } catch (error) {
    console.error(`❌ Ошибка выполнения команды ${cmd}:`, error.message);
    process.exit(1);
  }
}

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    runCommand(command);
    break;
}
