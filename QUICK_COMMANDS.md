# 🚀 Быстрые команды для NeuralChat

## 📦 Первоначальная настройка
```bash
# Клонирование репозитория (если еще не сделано)
git clone <your-repo-url>
cd neuralchat

# Установка зависимостей
npm install

# Копирование env файлов
cp packages/api/env.example packages/api/.env
cp packages/web/env.example packages/web/.env
cp packages/admin/env.example packages/admin/.env
```

## 🔧 Настройка переменных окружения

### Минимальный набор для packages/api/.env:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://neuralchat-admin:<password>@neuralchat-cluster.xxxxx.mongodb.net/neuralchat
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-12345
ANTHROPIC_API_KEY=<ваш ключ Claude>
GROK_API_KEY=<ваш ключ Grok>
GOOGLE_CLIENT_ID=<из Google Console>
GOOGLE_CLIENT_SECRET=<из Google Console>
```

## 🏃 Запуск для разработки

### Вариант 1: Docker (рекомендуется)
```bash
# Запуск MongoDB и Redis
docker-compose up -d mongodb redis

# Запуск приложения
npm run dev
```

### Вариант 2: Без Docker
```bash
# Установите Redis локально или используйте Redis Cloud
# Используйте MongoDB Atlas вместо локальной MongoDB

# Запуск приложения
npm run dev
```

### Вариант 3: Запуск по отдельности
```bash
# Terminal 1 - Backend
cd packages/api
npm run dev

# Terminal 2 - Frontend
cd packages/web
npm run dev

# Terminal 3 - Admin (опционально)
cd packages/admin
npm run dev
```

## 🌐 URL адреса

### Локальная разработка:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Panel: http://localhost:3001
- API Docs: http://localhost:5000/api-docs

### Production:
- Frontend: https://neuralchat.pro
- API: https://api.neuralchat.pro
- Admin: https://admin.neuralchat.pro

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Запуск тестов с покрытием
npm run test:coverage

# E2E тесты
npm run test:e2e
```

## 🏗️ Сборка для production

```bash
# Сборка всех пакетов
npm run build

# Сборка отдельных пакетов
npm run build:api
npm run build:web
npm run build:admin
```

## 🐳 Docker команды

```bash
# Сборка образов
docker build -t neuralchat-api -f docker/api.Dockerfile .
docker build -t neuralchat-web -f docker/web.Dockerfile .

# Запуск с docker-compose
docker-compose up -d

# Просмотр логов
docker-compose logs -f api
docker-compose logs -f web

# Остановка
docker-compose down
```

## 📊 База данных

```bash
# Создание индексов
npm run db:indexes

# Seed данные (опционально)
npm run db:seed

# Создание админа
npm run seed:admin -- --email admin@neuralchat.pro --password YourSecurePassword123!
```

## 🚀 Деплой

### AWS ECR (для API)
```bash
# Login в ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build и push
docker build -t neuralchat-api -f docker/api.Dockerfile .
docker tag neuralchat-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/neuralchat-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/neuralchat-api:latest
```

### AWS Amplify (для Frontend)
```bash
# Инициализация Amplify
amplify init

# Добавление хостинга
amplify add hosting

# Публикация
amplify publish
```

## 🧹 Очистка

```bash
# Очистка проекта (Windows)
powershell -ExecutionPolicy Bypass -File scripts/clean-project.ps1

# Очистка проекта (Mac/Linux)
bash scripts/clean-project.sh
```

## 📝 Полезные алиасы

Добавьте в ваш .bashrc или .zshrc:
```bash
alias nc-dev="npm run dev"
alias nc-build="npm run build"
alias nc-test="npm test"
alias nc-logs="docker-compose logs -f"
alias nc-restart="docker-compose restart"
```

## ⚡ Горячие клавиши в приложении

- `Ctrl/Cmd + K` - Быстрый поиск
- `Ctrl/Cmd + N` - Новый чат
- `Ctrl/Cmd + ,` - Настройки
- `Ctrl/Cmd + /` - Показать shortcuts

## 🌐 Настройка DNS и поддоменов

### Автоматическая настройка api.neuralchat.pro (PowerShell)
```powershell
# Запуск скрипта настройки
.\scripts\setup-api-subdomain.ps1
```

### Route 53 - Создание Hosted Zone
```bash
# Создать hosted zone
aws route53 create-hosted-zone \
  --name neuralchat.pro \
  --caller-reference "setup-$(date +%s)"

# Получить NS записи
aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='neuralchat.pro.'].DelegationSet.NameServers"
```

### Route 53 - Создание поддомена api
```bash
# Создать SSL сертификат
aws acm request-certificate \
  --domain-name api.neuralchat.pro \
  --validation-method DNS \
  --region us-east-1

# Создать ALIAS запись (после создания ALB)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.neuralchat.pro",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "your-alb-name.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

### Namecheap DNS - Создание Elastic IP
```bash
# Создать Elastic IP
aws ec2 allocate-address --domain vpc

# Получить allocation ID
aws ec2 describe-addresses \
  --query "Addresses[?Domain=='vpc'].AllocationId"
```

### Проверка DNS
```powershell
# Windows PowerShell
nslookup api.neuralchat.pro
Resolve-DnsName api.neuralchat.pro

# Проверка HTTPS
Invoke-WebRequest -Uri https://api.neuralchat.pro/health -Method HEAD
```

```bash
# Linux/Mac
dig api.neuralchat.pro
curl -I https://api.neuralchat.pro/health
```

---

**Нужна помощь?** 
- DNS настройка: [DNS_SETUP_GUIDE.md](./DNS_SETUP_GUIDE.md)
- API поддомен: [API_SUBDOMAIN_SETUP.md](./API_SUBDOMAIN_SETUP.md)
- Полный гайд: [LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md) 