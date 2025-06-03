# AWS Amplify Deployment Guide

## Environment Variables Configuration

### Required Environment Variables for Web App (packages/web)

В AWS Amplify Console нужно настроить следующие переменные окружения:

#### Production Environment Variables:

```env
# API Configuration
REACT_APP_API_URL=https://api.neuralchat.pro
REACT_APP_WS_URL=wss://api.neuralchat.pro

# Environment
REACT_APP_ENV=production

# Features Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_SENTRY=true

# App Info
REACT_APP_VERSION=1.0.0
REACT_APP_NAME=Neural Chat

# External Services (нужно добавить ваши ключи)
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_SENTRY_DSN=your_sentry_dsn
REACT_APP_GA_TRACKING_ID=your_google_analytics_id
```

### Required Environment Variables for Admin App (packages/admin)

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.neuralchat.pro

# Environment
NEXT_PUBLIC_ENV=production

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth Configuration
NEXTAUTH_URL=https://admin.neuralchat.pro
NEXTAUTH_SECRET=your_nextauth_secret
```

## Deployment Steps

1. **Исправили конфигурацию монорепо** - добавили секцию `applications` в amplify.yml
2. **Настройте переменные окружения** в AWS Amplify Console
3. **Настройте домены:**
   - Основное приложение: `neuralchat.pro` → packages/web
   - Админ панель: `admin.neuralchat.pro` → packages/admin
   - API: `api.neuralchat.pro` → ECS/EC2

## Build Configuration

Amplify теперь правильно настроен для монорепо с:
- Автоматической установкой зависимостей
- Сборкой shared пакетов
- Правильными путями артефактов

## Troubleshooting

Если деплой не работает:
1. Проверьте переменные окружения в Amplify Console
2. Убедитесь что домен правильно настроен
3. Проверьте логи сборки в Amplify Console 