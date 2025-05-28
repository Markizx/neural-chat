#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Цвета для консоли
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvFiles() {
  console.log(`${colors.blue}=== Настройка переменных окружения ===${colors.reset}\n`);
  
  const packages = ['api', 'web', 'admin'];
  
  for (const pkg of packages) {
    const examplePath = path.join(__dirname, '..', 'packages', pkg, 'env.example');
    const envPath = path.join(__dirname, '..', 'packages', pkg, '.env');
    const dotExamplePath = path.join(__dirname, '..', 'packages', pkg, '.env.example');
    
    console.log(`\n${colors.blue}Настройка ${pkg}...${colors.reset}`);
    
    // Проверяем наличие env.example
    if (!fs.existsSync(examplePath)) {
      console.log(`${colors.red}✗ Файл env.example не найден для ${pkg}${colors.reset}`);
      continue;
    }
    
    // Переименовываем env.example в .env.example
    if (!fs.existsSync(dotExamplePath)) {
      fs.renameSync(examplePath, dotExamplePath);
      console.log(`${colors.green}✓ Переименован env.example в .env.example${colors.reset}`);
    }
    
    // Проверяем, существует ли уже .env
    if (fs.existsSync(envPath)) {
      const answer = await question(`${colors.yellow}Файл .env уже существует. Перезаписать? (y/n): ${colors.reset}`);
      if (answer.toLowerCase() !== 'y') {
        console.log('Пропускаем...');
        continue;
      }
    }
    
    // Копируем .env.example в .env
    fs.copyFileSync(dotExamplePath, envPath);
    console.log(`${colors.green}✓ Создан файл .env${colors.reset}`);
  }
  
  console.log(`\n${colors.green}✓ Базовая настройка завершена!${colors.reset}`);
  console.log(`\n${colors.yellow}Важно:${colors.reset}`);
  console.log('1. Отредактируйте .env файлы и замените значения по умолчанию');
  console.log('2. См. документацию ENV_SETUP.md для подробной информации');
  console.log('3. Запустите "npm run check:env" для проверки конфигурации');
  
  rl.close();
}

setupEnvFiles().catch(console.error); 