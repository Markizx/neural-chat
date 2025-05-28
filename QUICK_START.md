# Быстрый старт NeuralChat

## 🚀 Локальная разработка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
```bash
# Автоматическая настройка
npm run setup:env

# Проверка конфигурации
npm run check:env
```

### 3. Настройка внешних сервисов

#### MongoDB
- Локально: установите MongoDB или используйте Docker
- Облако: создайте бесплатный кластер на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

#### Redis
- Локально: `docker run -p 6379:6379 redis:7-alpine`
- Облако: используйте [Redis Cloud](https://redis.com/cloud/)

### 4. Запуск проекта
```bash
# Запуск всех сервисов
npm run dev

# Или по отдельности:
npm run dev:api   # API на http://localhost:5000
npm run dev:web   # Web на http://localhost:3000
cd packages/admin && npm run dev  # Admin на http://localhost:3001
```

## 🌐 Деплой на AWS

### Предварительные требования
- AWS аккаунт
- AWS CLI установлен и настроен
- Docker установлен
- Terraform (опционально)

### Быстрый деплой

1. **Настройка инфраструктуры**
```bash
# С помощью Terraform
cd aws/infrastructure/terraform
terraform init
terraform plan
terraform apply

# Или вручную через AWS Console
```

2. **Деплой API на ECS**
```bash
# Сборка и публикация Docker образа
npm run build:api
docker build -t neuralchat-api -f docker/api.Dockerfile .
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL
docker tag neuralchat-api:latest $ECR_URL/neuralchat-api:latest
docker push $ECR_URL/neuralchat-api:latest

# Создание ECS сервиса
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json
aws ecs create-service --cli-input-json file://aws/ecs-service.json
```

3. **Деплой Frontend на Amplify**
```bash
# В AWS Console:
# 1. Создайте новое Amplify приложение
# 2. Подключите GitHub репозиторий
# 3. Выберите ветку main
# 4. Amplify автоматически использует amplify.yml
```

4. **Деплой Admin на Amplify**
```bash
# Создайте второе Amplify приложение
# При настройке укажите amplify-admin.yml
```

## 📝 Чек-лист перед production

- [ ] Все переменные окружения настроены для production
- [ ] SSL сертификаты настроены
- [ ] Backup стратегия для MongoDB
- [ ] Мониторинг настроен (CloudWatch)
- [ ] Алерты настроены
- [ ] Секреты в AWS Secrets Manager
- [ ] Security Groups правильно настроены
- [ ] Auto-scaling настроен для ECS

## 🆘 Помощь

- Полная документация: [DEPLOYMENT_AUDIT.md](DEPLOYMENT_AUDIT.md)
- Настройка окружения: [ENV_SETUP.md](ENV_SETUP.md)
- Проблемы: создайте issue в репозитории 