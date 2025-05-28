#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Цвета для консоли
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Обязательные переменные для каждого пакета
const requiredEnvVars = {
  api: [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'REDIS_URL',
    'JWT_SECRET',
    'FRONTEND_URL',
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
    'SESSION_SECRET'
  ],
  web: [
    'REACT_APP_API_URL',
    'REACT_APP_STRIPE_PUBLIC_KEY',
    'REACT_APP_GOOGLE_CLIENT_ID'
  ],
  admin: [
    'NEXT_PUBLIC_API_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ]
};

function checkEnvFile(packageName, envPath) {
  console.log(`\n${colors.blue}Проверка ${packageName}...${colors.reset}`);
  
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}✗ Файл .env не найден!${colors.reset}`);
    console.log(`  Создайте его командой: cp ${path.dirname(envPath)}/.env.example ${envPath}`);
    return false;
  }
  
  // Читаем .env файл
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, value] = line.split('=');
      envVars[key.trim()] = value.trim();
    }
  });
  
  // Проверяем обязательные переменные
  let hasErrors = false;
  const required = requiredEnvVars[packageName] || [];
  
  required.forEach(varName => {
    if (!envVars[varName] || envVars[varName].startsWith('your-')) {
      console.log(`${colors.red}✗ ${varName} не настроена${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✓ ${varName}${colors.reset}`);
    }
  });
  
  // Предупреждения
  if (envVars.NODE_ENV === 'production') {
    console.log(`${colors.yellow}⚠ NODE_ENV установлен в production!${colors.reset}`);
  }
  
  return !hasErrors;
}

function main() {
  console.log(`${colors.blue}=== Проверка переменных окружения ===${colors.reset}`);
  
  const packages = ['api', 'web', 'admin'];
  let allValid = true;
  
  packages.forEach(pkg => {
    const envPath = path.join(__dirname, '..', 'packages', pkg, '.env');
    const isValid = checkEnvFile(pkg, envPath);
    if (!isValid) allValid = false;
  });
  
  console.log('\n' + '='.repeat(40));
  
  if (allValid) {
    console.log(`${colors.green}✓ Все переменные окружения настроены!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Обнаружены проблемы с переменными окружения${colors.reset}`);
    console.log(`\nСм. документацию: ${colors.blue}ENV_SETUP.md${colors.reset}`);
    process.exit(1);
  }
}

main(); 