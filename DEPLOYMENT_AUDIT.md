# Аудит проекта NeuralChat для деплоя на AWS

## Общий обзор проекта

Проект представляет собой монорепозиторий на базе Lerna с следующими компонентами:
- **Frontend (web)**: React приложение на Create React App
- **Admin Panel (admin)**: Next.js приложение
- **Backend API (api)**: Express.js приложение
- **Shared**: Общие компоненты
- **UI Kit**: Компоненты интерфейса

## Результаты аудита

### ✅ Положительные аспекты

1. **Структура проекта**
   - Хорошо организованная монорепозиторий структура с Lerna
   - Разделение на логические пакеты
   - Использование TypeScript (хотя есть смешение с JS)

2. **Docker конфигурация**
   - Правильно настроенные multi-stage Dockerfile для оптимизации размера образов
   - Отдельные Dockerfile для API и Web
   - Настроен nginx для production

3. **AWS конфигурация**
   - Есть amplify.yml для Amplify деплоя
   - Настроен task-definition.json для ECS
   - Есть buildspec.yml для CodeBuild

4. **Безопасность**
   - Использование helmet для API
   - CORS настройки
   - Rate limiting через Redis
   - Санитизация MongoDB запросов

### ⚠️ Проблемы и рекомендации

#### 1. **Критические проблемы для деплоя** ✅ РЕШЕНО

**Проблема**: Смешение JavaScript и TypeScript в API
- В package.json API указан TypeScript, но точка входа `src/index.js` - JavaScript файл
- Это приведет к ошибке при билде

**Решение**: ✅ ВЫПОЛНЕНО
- В `tsconfig.json` уже настроены параметры `"allowJs": true` и `"checkJs": false`
- Это позволяет использовать JavaScript файлы вместе с TypeScript

**Проблема**: Отсутствие .env файлов примеров
- Нет документации по необходимым переменным окружения
- Разработчики не будут знать, какие переменные нужны

**Решение**: ✅ ВЫПОЛНЕНО
- Созданы файлы `env.example` для всех пакетов:
  - `packages/api/env.example`
  - `packages/web/env.example`
  - `packages/admin/env.example`
- Создана документация `ENV_SETUP.md` с подробными инструкциями
- Добавлены скрипты:
  - `npm run setup:env` - автоматическая настройка .env файлов
  - `npm run check:env` - проверка конфигурации

**Примечание**: Файлы `env.example` нужно переименовать в `.env.example`:
```bash
npm run setup:env
```

#### 2. **Проблемы с AWS Amplify**

**Проблема**: amplify.yml настроен для двух приложений, но Amplify обычно деплоит одно
- В файле есть секции для frontend и backend

**Решение**: 
- Использовать отдельные Amplify приложения для web и admin
- Убрать backend секцию из amplify.yml (API деплоится на ECS)

**Рекомендуемый amplify.yml для web**:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
        - npm run bootstrap
        - npm run build:shared
        - npm run build --workspace=@smartchat/ui-kit
    build:
      commands:
        - npm run build --workspace=@smartchat/web
  artifacts:
    baseDirectory: packages/web/build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - packages/*/node_modules/**/*
```

#### 3. **Проблемы с ECS деплоем**

**Проблема**: В task-definition.json включен web контейнер
- Web должен деплоиться через Amplify, не ECS

**Решение**: Обновить task-definition.json только для API:
```json
{
  "family": "smartchat-api-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/smartchat-api:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:smartchat/mongodb-uri"
        },
        {
          "name": "REDIS_URL", 
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:smartchat/redis-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:smartchat/jwt-secret"
        },
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:smartchat/anthropic-key"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:smartchat/stripe-secret"
        },
        {
          "name": "SENDGRID_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:smartchat/sendgrid-key"
        },
        {
          "name": "AWS_S3_BUCKET",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:smartchat/s3-bucket"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/smartchat-api",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ],
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/smartchat-task-role",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/smartchat-execution-role"
}
```

#### 4. **Отсутствующие сервисы AWS**

Для полноценной работы нужно настроить:

1. **MongoDB Atlas** или **Amazon DocumentDB**
2. **Amazon ElastiCache for Redis**
3. **Amazon S3** для хранения файлов
4. **AWS Secrets Manager** для хранения секретов
5. **Amazon CloudFront** для CDN
6. **Application Load Balancer** для API

#### 5. **Проблемы с Admin панелью**

**Проблема**: Admin панель на Next.js не настроена для Amplify
- Нужен отдельный amplify.yml

**Решение**: Создать amplify-admin.yml:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
        - npm run bootstrap
        - npm run build:shared
    build:
      commands:
        - cd packages/admin
        - npm run build
        - cd ../..
  artifacts:
    baseDirectory: packages/admin/.next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - packages/*/node_modules/**/*
```

### 📋 Чек-лист для деплоя

#### Подготовка AWS инфраструктуры:

- [ ] Создать ECR репозитории для Docker образов
- [ ] Настроить ECS кластер для API
- [ ] Создать Application Load Balancer
- [ ] Настроить MongoDB Atlas или DocumentDB
- [ ] Настроить ElastiCache Redis кластер
- [ ] Создать S3 bucket для файлов
- [ ] Настроить Secrets Manager с необходимыми секретами
- [ ] Создать IAM роли для ECS задач
- [ ] Настроить CloudFront дистрибуцию

#### Настройка Amplify:

- [ ] Создать Amplify приложение для web
- [ ] Создать отдельное Amplify приложение для admin
- [ ] Настроить переменные окружения в Amplify
- [ ] Подключить GitHub репозиторий

#### Настройка CI/CD:

- [ ] Настроить CodeBuild проект
- [ ] Настроить CodePipeline для автоматического деплоя
- [ ] Настроить уведомления о деплое

### 🔧 Необходимые исправления перед деплоем

1. **Создать файлы переменных окружения**:

Создать `packages/api/.env.example`:
```env
# Node Environment
NODE_ENV=development
PORT=5000
API_PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/smartchat

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=smartchat-uploads

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@smartchat.ai

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Session
SESSION_SECRET=your-session-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Создать `packages/web/.env.example`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-public-key
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

Создать `packages/admin/.env.example`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret
```

2. **Исправить TypeScript конфигурацию API**:

Обновить `packages/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    // ... остальные настройки
  }
}
```

3. **Создать отдельный amplify.yml для админки**:

Создать `amplify-admin.yml`:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
        - npm run bootstrap
        - npm run build:shared
    build:
      commands:
        - cd packages/admin
        - npm run build
        - cd ../..
  artifacts:
    baseDirectory: packages/admin
    files:
      - '.next/**/*'
      - 'public/**/*'
      - 'package.json'
      - 'next.config.js'
  cache:
    paths:
      - node_modules/**/*
      - packages/*/node_modules/**/*
```

4. **Обновить скрипты package.json для production билда**:

В корневом `package.json` добавить:
```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production npm run build:all",
    "docker:build:prod": "docker build -t smartchat-api:latest -f docker/api.Dockerfile --build-arg NODE_ENV=production ."
  }
}
```

### 🚀 Пошаговая инструкция деплоя

#### Шаг 1: Подготовка AWS аккаунта

```bash
# Установить AWS CLI
# Настроить credentials
aws configure

# Создать S3 bucket для артефактов
aws s3 mb s3://smartchat-deployment-artifacts

# Создать ECR репозиторий
aws ecr create-repository --repository-name smartchat-api
```

#### Шаг 2: Настройка секретов в AWS Secrets Manager

```bash
# Создать секреты
aws secretsmanager create-secret --name smartchat/mongodb-uri --secret-string "mongodb+srv://..."
aws secretsmanager create-secret --name smartchat/redis-url --secret-string "redis://..."
aws secretsmanager create-secret --name smartchat/jwt-secret --secret-string "your-secret"
# ... и так далее для всех секретов
```

#### Шаг 3: Деплой API на ECS

```bash
# Собрать и запушить Docker образ
npm run build:prod
docker build -t smartchat-api -f docker/api.Dockerfile .
docker tag smartchat-api:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/smartchat-api:latest
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/smartchat-api:latest

# Создать ECS задачу и сервис
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json
aws ecs create-service --cluster smartchat-cluster --service-name smartchat-api --task-definition smartchat-api-task
```

#### Шаг 4: Деплой Frontend на Amplify

```bash
# В консоли AWS Amplify:
# 1. Создать новое приложение
# 2. Подключить GitHub репозиторий
# 3. Выбрать ветку для деплоя
# 4. Использовать amplify.yml из репозитория
# 5. Настроить переменные окружения
```

#### Шаг 5: Деплой Admin на Amplify

```bash
# Повторить шаги для админки с использованием amplify-admin.yml
```

### ⚡ Оптимизации производительности

1. **Включить CloudFront для статики**
2. **Настроить auto-scaling для ECS**
3. **Использовать ElastiCache для сессий**
4. **Включить gzip сжатие в nginx**
5. **Оптимизировать размеры Docker образов**

### 🔒 Безопасность

1. **Использовать VPC для изоляции сервисов**
2. **Настроить Security Groups правильно**
3. **Включить AWS WAF для защиты от атак**
4. **Использовать SSL сертификаты через ACM**
5. **Регулярно обновлять зависимости**

### 📊 Мониторинг

Настроить:
- **CloudWatch Logs** для логов
- **CloudWatch Metrics** для метрик
- **X-Ray** для трейсинга
- **CloudWatch Alarms** для алертов

### 💰 Примерная стоимость инфраструктуры

- **ECS Fargate** (1 vCPU, 2GB RAM): ~$36/месяц
- **Application Load Balancer**: ~$22/месяц
- **ElastiCache Redis** (t3.micro): ~$13/месяц
- **MongoDB Atlas** (M10): ~$57/месяц
- **Amplify Hosting**: ~$12/месяц за приложение
- **CloudFront**: ~$10/месяц
- **S3 + прочее**: ~$10/месяц

**Итого**: ~$172/месяц для минимальной production конфигурации

### 🎯 Заключение

Проект в целом готов к деплою, но требует:
1. Создания файлов с переменными окружения
2. Небольших исправлений в конфигурации
3. Настройки AWS инфраструктуры
4. Разделения amplify.yml для разных приложений

После выполнения всех рекомендаций проект будет успешно развернут на AWS с использованием современных практик DevOps.