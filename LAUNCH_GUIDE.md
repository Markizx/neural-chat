# 🚀 Пошаговое руководство по запуску NeuralChat

## 📋 Что у вас уже есть:
- ✅ Домен neuralchat.pro (Namecheap)
- ✅ AWS Console аккаунт
- ✅ API ключи Claude и Grok
- ✅ Google Cloud аккаунт
- ⏳ MongoDB Atlas (нужно создать)
- ⏳ Google OAuth ключи (нужно создать)
- ⏳ Apple Developer (в процессе)
- ⏳ Stripe (в процессе)

## 🎯 Шаг 1: Настройка MongoDB Atlas (15 минут)

### 1.1 Создание кластера:
1. Перейдите на https://www.mongodb.com/atlas
2. Зарегистрируйтесь или войдите
3. Нажмите "Build a Database"
4. Выберите **FREE** план (M0 Sandbox)
5. Выберите провайдера: **AWS**
6. Регион: **us-east-1** (или ближайший к вам)
7. Имя кластера: `neuralchat-cluster`
8. Нажмите "Create"

### 1.2 Настройка доступа:
1. В разделе "Security" → "Database Access"
2. Нажмите "Add New Database User"
3. Username: `neuralchat-admin`
4. Password: сгенерируйте надежный пароль
5. Database User Privileges: "Atlas Admin"
6. Нажмите "Add User"

### 1.3 Настройка сети:
1. В разделе "Security" → "Network Access"
2. Нажмите "Add IP Address"
3. Для разработки: нажмите "Allow Access from Anywhere" (0.0.0.0/0)
4. Для production: добавьте IP адреса AWS ECS

### 1.4 Получение строки подключения:
1. На главной странице кластера нажмите "Connect"
2. Выберите "Connect your application"
3. Скопируйте строку подключения:
   ```
   mongodb+srv://neuralchat-admin:<password>@neuralchat-cluster.xxxxx.mongodb.net/neuralchat?retryWrites=true&w=majority
   ```

## 🎯 Шаг 2: Настройка Google OAuth (10 минут)

### 2.1 Создание проекта:
1. Перейдите на https://console.cloud.google.com
2. Создайте новый проект: "NeuralChat"
3. Дождитесь создания проекта

### 2.2 Включение OAuth:
1. Перейдите в "APIs & Services" → "OAuth consent screen"
2. Выберите "External"
3. Заполните:
   - App name: NeuralChat
   - User support email: ваш email
   - App domain: neuralchat.pro
   - Developer contact: ваш email
4. Добавьте scopes: email, profile
5. Сохраните

### 2.3 Создание credentials:
1. "APIs & Services" → "Credentials"
2. "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "NeuralChat Web"
5. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://neuralchat.pro
   https://www.neuralchat.pro
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://neuralchat.pro/api/auth/callback/google
   https://api.neuralchat.pro/auth/google/callback
   ```
7. Сохраните Client ID и Client Secret

## 🎯 Шаг 3: Локальная настройка проекта (5 минут)

### 3.1 Клонирование и установка:
```bash
# Установка зависимостей
npm install

# Создание .env файлов
cp packages/api/env.example packages/api/.env
cp packages/web/env.example packages/web/.env
cp packages/admin/env.example packages/admin/.env
```

### 3.2 Настройка packages/api/.env:
```env
# Node Environment
NODE_ENV=development
PORT=5000

# Database (используйте строку из MongoDB Atlas)
MONGODB_URI=mongodb+srv://neuralchat-admin:<password>@neuralchat-cluster.xxxxx.mongodb.net/neuralchat?retryWrites=true&w=majority

# Redis (для локальной разработки)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRE=7d

# Frontend URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# AI APIs (ваши ключи)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
GROK_API_KEY=xai-xxxxx

# Google OAuth (из шага 2.3)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# Временные заглушки (пока в процессе)
STRIPE_SECRET_KEY=sk_test_dummy
STRIPE_WEBHOOK_SECRET=whsec_dummy
SENDGRID_API_KEY=SG.dummy
```

### 3.3 Настройка packages/web/.env:
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### 3.4 Настройка packages/admin/.env:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-key-12345
```

## 🎯 Шаг 4: Запуск локально (5 минут)

### 4.1 Запуск Redis (если нет Docker):
```bash
# Windows: скачайте Redis для Windows или используйте WSL
# Mac: brew install redis && brew services start redis
# Linux: sudo apt install redis-server && sudo systemctl start redis
```

### 4.2 Запуск с Docker (рекомендуется):
```bash
# Запуск только MongoDB и Redis
docker-compose up -d mongodb redis
```

### 4.3 Запуск приложения:
```bash
# Запуск всех сервисов
npm run dev

# Или по отдельности:
npm run dev:api    # Backend на http://localhost:5000
npm run dev:web    # Frontend на http://localhost:3000
npm run dev:admin  # Admin на http://localhost:3001
```

## 🎯 Шаг 5: Настройка домена в Namecheap (20 минут)

### 5.1 Базовые DNS записи:
1. Войдите в Namecheap Dashboard
2. Перейдите в Domain List → Manage → Advanced DNS
3. Удалите стандартные записи
4. Добавьте:

```
Type    Host    Value                   TTL
A       @       <AWS ALB IP>            Automatic
A       www     <AWS ALB IP>            Automatic
A       api     <AWS ALB IP>            Automatic
A       admin   <AWS Amplify IP>        Automatic
CNAME   _acme   <для SSL сертификата>   Automatic
```

### 5.2 Временно для тестирования:
Можете направить на ваш публичный IP для тестирования

## 🎯 Шаг 6: Деплой на AWS - Backend API (1 час)

### 6.1 Создание ECR репозитория:
```bash
# В AWS Console → ECR → Create repository
# Name: neuralchat-api
# Затем получите команды для push:

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin xxxxx.dkr.ecr.us-east-1.amazonaws.com

# Build и push Docker образа
cd packages/api
docker build -t neuralchat-api .
docker tag neuralchat-api:latest xxxxx.dkr.ecr.us-east-1.amazonaws.com/neuralchat-api:latest
docker push xxxxx.dkr.ecr.us-east-1.amazonaws.com/neuralchat-api:latest
```

### 6.2 Создание ECS кластера:
1. AWS Console → ECS → Create Cluster
2. Cluster name: `neuralchat-cluster`
3. Infrastructure: AWS Fargate

### 6.3 Создание Task Definition:
1. Используйте файл `aws/task-definition.json`
2. Обновите:
   - Image URI из ECR
   - Переменные окружения
   - Secrets из AWS Secrets Manager

### 6.4 Создание сервиса:
1. Cluster → Create Service
2. Launch type: Fargate
3. Task Definition: выберите созданную
4. Service name: `neuralchat-api`
5. Number of tasks: 2
6. Настройте Load Balancer

## 🎯 Шаг 7: Деплой на AWS - Frontend (30 минут)

### 7.1 AWS Amplify для Web:
```bash
# В корне проекта
amplify init
# Name: neuralchatweb
# Environment: prod
# Default editor: Visual Studio Code
# App type: javascript
# Framework: react
# Source: packages/web
# Build: npm run build
# Start: npm run start

amplify add hosting
# Hosting with Amplify Console

amplify publish
```

### 7.2 Переменные окружения в Amplify:
1. AWS Amplify Console → App settings → Environment variables
2. Добавьте:
```
REACT_APP_API_URL=https://api.neuralchat.pro/api/v1
REACT_APP_WS_URL=wss://api.neuralchat.pro
REACT_APP_GOOGLE_CLIENT_ID=xxxxx
```

### 7.3 Настройка домена в Amplify:
1. Domain management → Add domain
2. Добавьте neuralchat.pro
3. Следуйте инструкциям для настройки DNS

## 🎯 Шаг 8: Настройка SSL сертификатов

### 8.1 AWS Certificate Manager:
1. Request certificate
2. Domain: *.neuralchat.pro, neuralchat.pro
3. Validation: DNS
4. Добавьте CNAME записи в Namecheap

## 🎯 Шаг 9: Финальная проверка

### 9.1 Тестирование endpoints:
```bash
# API Health check
curl https://api.neuralchat.pro/health

# Frontend
open https://neuralchat.pro

# Admin panel
open https://admin.neuralchat.pro
```

### 9.2 Создание первого админа:
```bash
# SSH в ECS task или локально
npm run seed:admin -- --email admin@neuralchat.pro --password SecurePassword123!
```

## 📱 Шаг 10: Мониторинг и логи

### 10.1 CloudWatch:
- Настройте алерты для ECS
- Настройте логи для debugging

### 10.2 Проверка функциональности:
1. Регистрация нового пользователя
2. Вход через Google OAuth
3. Создание чата с Claude
4. Создание чата с Grok
5. Тест Brainstorm mode

## ⚠️ Важные заметки:

1. **Безопасность**: Обязательно смените все тестовые ключи на production
2. **Backup**: Настройте автоматический backup MongoDB
3. **Мониторинг**: Используйте AWS CloudWatch или DataDog
4. **CI/CD**: Настройте GitHub Actions для автоматического деплоя

## 🆘 Если что-то пошло не так:

1. Проверьте логи: `docker logs <container>`
2. Проверьте переменные окружения
3. Проверьте сетевые настройки и Security Groups
4. Проверьте права доступа IAM

---

**Удачного запуска NeuralChat! 🎉** 