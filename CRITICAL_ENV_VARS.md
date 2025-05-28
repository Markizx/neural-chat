# 🚨 Критические переменные окружения для AWS Amplify

## Для Frontend (packages/web) - AWS Amplify

### ⚠️ ОБЯЗАТЕЛЬНЫЕ переменные (без них приложение НЕ запустится):

```env
# 1. API URL - самая критичная!
REACT_APP_API_URL=https://api.neuralchat.pro/api/v1

# 2. WebSocket URL для real-time функций
REACT_APP_WS_URL=wss://api.neuralchat.pro
```

### ⚡ ВАЖНЫЕ переменные (приложение запустится, но функции будут ограничены):

```env
# 3. Google OAuth - без этого не будет работать вход через Google
REACT_APP_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com

# 4. Stripe - без этого не будут работать платежи
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

### 📝 ОПЦИОНАЛЬНЫЕ переменные (для полной функциональности):

```env
# Аналитика и мониторинг
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
REACT_APP_ENABLE_SENTRY=true
REACT_APP_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Окружение
REACT_APP_ENV=production
```

## Для Admin Panel (packages/admin) - AWS Amplify

### ⚠️ ОБЯЗАТЕЛЬНЫЕ переменные:

```env
# 1. API URL
NEXT_PUBLIC_API_URL=https://api.neuralchat.pro/api/v1

# 2. WebSocket URL
NEXT_PUBLIC_WS_URL=wss://api.neuralchat.pro

# 3. NextAuth конфигурация
NEXTAUTH_URL=https://admin.neuralchat.pro
NEXTAUTH_SECRET=your-super-secret-key-generate-with-openssl

# 4. Google OAuth для админов
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

### 📝 ОПЦИОНАЛЬНЫЕ переменные:

```env
# Список email админов
ADMIN_EMAILS=admin@neuralchat.pro,support@neuralchat.pro

# Мониторинг
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=true
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 🔧 Как добавить в AWS Amplify:

### 1. Через консоль AWS:
1. Откройте AWS Amplify Console
2. Выберите ваше приложение
3. App settings → Environment variables
4. Add variable → введите имя и значение
5. Save

### 2. Через amplify.yml:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: packages/web/build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
  # Переменные окружения берутся из консоли Amplify
```

## ⚡ Минимальный набор для быстрого старта:

### Frontend (всего 2 переменные!):
```env
REACT_APP_API_URL=https://api.neuralchat.pro/api/v1
REACT_APP_WS_URL=wss://api.neuralchat.pro
```

### Admin (всего 4 переменные!):
```env
NEXT_PUBLIC_API_URL=https://api.neuralchat.pro/api/v1
NEXTAUTH_URL=https://admin.neuralchat.pro
NEXTAUTH_SECRET=<сгенерируйте с помощью: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<из Google Console>
```

## 🚨 Частые ошибки:

1. **"Cannot read property 'REACT_APP_API_URL' of undefined"**
   - Не установлена переменная REACT_APP_API_URL

2. **"Failed to connect to WebSocket"**
   - Не установлена REACT_APP_WS_URL или неправильный протокол (должен быть wss:// для HTTPS)

3. **"Google Sign-In error"**
   - Не установлена REACT_APP_GOOGLE_CLIENT_ID

4. **NextAuth ошибки в админке:**
   - Не установлены NEXTAUTH_URL или NEXTAUTH_SECRET

## 💡 Проверка переменных:

В браузере откройте консоль и выполните:
```javascript
// Для React приложения
console.log(process.env.REACT_APP_API_URL);
console.log(process.env.REACT_APP_WS_URL);

// Должны увидеть ваши значения, а не undefined
```

## 🔐 Генерация секретных ключей:

```bash
# Для NEXTAUTH_SECRET
openssl rand -base64 32

# Или альтернатива
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

**Помните**: После добавления переменных в AWS Amplify нужно сделать redeploy приложения! 