# 🔧 Настройка поддомена api.neuralchat.pro

## Предварительные требования
- ✅ Домен neuralchat.pro зарегистрирован в Namecheap
- ✅ AWS аккаунт настроен
- ✅ API развернут на ECS или готов к развертыванию

## 📊 Выбор метода DNS

### Метод 1: Route 53 (Рекомендуется) ✅
**Преимущества:**
- ALIAS записи (бесплатные запросы)
- Автоматическое обновление при изменении IP
- Интеграция с AWS сервисами
- Health checks

**Стоимость:** $0.50/месяц за hosted zone

### Метод 2: Namecheap DNS ⚠️
**Преимущества:**
- Бесплатно
- Простая настройка

**Недостатки:**
- Только A/CNAME записи
- Нужен Elastic IP ($3.60/месяц)
- Нет автоматической интеграции

## 🚀 Настройка через Route 53

### Шаг 1: Создайте Hosted Zone (если еще не создана)
```bash
# Создание hosted zone
aws route53 create-hosted-zone \
  --name neuralchat.pro \
  --caller-reference "initial-setup-$(date +%s)"

# Получите Zone ID и NS записи
aws route53 list-hosted-zones --query "HostedZones[?Name=='neuralchat.pro.']"
```

### Шаг 2: Настройте NS записи в Namecheap
1. Войдите в Namecheap → Domain List → Manage
2. Выберите **Custom DNS**
3. Добавьте 4 NS записи из Route 53:
   ```
   ns-1234.awsdns-12.org
   ns-5678.awsdns-34.com
   ns-9012.awsdns-56.net
   ns-3456.awsdns-78.co.uk
   ```

### Шаг 3: Дождитесь распространения DNS (1-48 часов)
```bash
# Проверка NS записей
nslookup -type=NS neuralchat.pro
```

### Шаг 4: Создайте SSL сертификат
```bash
# Запросите сертификат для API
aws acm request-certificate \
  --domain-name api.neuralchat.pro \
  --validation-method DNS \
  --region us-east-1

# Получите CNAME для валидации
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/xxx \
  --query "Certificate.DomainValidationOptions"
```

### Шаг 5: Добавьте CNAME для валидации SSL
```bash
# Создайте CNAME запись для валидации
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_1234567890.api.neuralchat.pro",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{
          "Value": "_abcdefghij.acm-validations.aws."
        }]
      }
    }]
  }'
```

### Шаг 6: Создайте ALB с HTTPS
```bash
# Создайте ALB с SSL сертификатом
aws elbv2 create-load-balancer \
  --name neuralchat-api-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345678 \
  --scheme internet-facing \
  --type application

# Добавьте HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Шаг 7: Создайте ALIAS запись для api.neuralchat.pro
```bash
# Получите данные ALB
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names neuralchat-api-alb \
  --query "LoadBalancers[0].DNSName" \
  --output text)

ALB_ZONE=$(aws elbv2 describe-load-balancers \
  --names neuralchat-api-alb \
  --query "LoadBalancers[0].CanonicalHostedZoneId" \
  --output text)

# Создайте ALIAS запись
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch "{
    \"Changes\": [{
      \"Action\": \"CREATE\",
      \"ResourceRecordSet\": {
        \"Name\": \"api.neuralchat.pro\",
        \"Type\": \"A\",
        \"AliasTarget\": {
          \"HostedZoneId\": \"$ALB_ZONE\",
          \"DNSName\": \"$ALB_DNS\",
          \"EvaluateTargetHealth\": true
        }
      }
    }]
  }"
```

## 🌐 Настройка через Namecheap DNS

### Шаг 1: Создайте Network Load Balancer
```bash
# ALB не поддерживает Elastic IP, нужен NLB
aws elbv2 create-load-balancer \
  --name neuralchat-api-nlb \
  --subnets subnet-12345 \
  --type network \
  --scheme internet-facing
```

### Шаг 2: Создайте Elastic IP
```bash
# Выделите Elastic IP
aws ec2 allocate-address --domain vpc

# Привяжите к NLB (через консоль AWS)
```

### Шаг 3: Настройте в Namecheap
1. Namecheap → Domain List → Manage → Advanced DNS
2. Add New Record:
   - Type: `A Record`
   - Host: `api`
   - Value: `54.123.45.67` (ваш Elastic IP)
   - TTL: `Automatic`

### Шаг 4: Настройте SSL через Let's Encrypt
```bash
# На EC2 instance за NLB
sudo certbot certonly --standalone -d api.neuralchat.pro
```

## 🔍 Проверка настройки

### 1. Проверка DNS
```bash
# Windows PowerShell
nslookup api.neuralchat.pro
Resolve-DnsName api.neuralchat.pro

# Проверка HTTPS
curl -I https://api.neuralchat.pro/health
```

### 2. Онлайн инструменты
- https://dnschecker.org/#A/api.neuralchat.pro
- https://www.ssllabs.com/ssltest/analyze.html?d=api.neuralchat.pro

## 📝 Обновление переменных окружения

### Frontend (packages/web/.env)
```env
REACT_APP_API_URL=https://api.neuralchat.pro
REACT_APP_WS_URL=wss://api.neuralchat.pro
```

### Admin Panel (packages/admin/.env)
```env
NEXT_PUBLIC_API_URL=https://api.neuralchat.pro
```

### API (packages/api/.env)
```env
FRONTEND_URL=https://neuralchat.pro
ADMIN_URL=https://admin.neuralchat.pro
```

## ⚡ Быстрая настройка (Route 53)

```bash
# Скрипт для автоматической настройки
#!/bin/bash

ZONE_ID="Z1234567890ABC"
ALB_ARN="arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/neuralchat-api-alb/1234567890abcdef"

# Получить данные ALB
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query "LoadBalancers[0].DNSName" --output text)
ALB_ZONE=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query "LoadBalancers[0].CanonicalHostedZoneId" --output text)

# Создать запись
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch "{
    \"Changes\": [{
      \"Action\": \"UPSERT\",
      \"ResourceRecordSet\": {
        \"Name\": \"api.neuralchat.pro\",
        \"Type\": \"A\",
        \"AliasTarget\": {
          \"HostedZoneId\": \"$ALB_ZONE\",
          \"DNSName\": \"$ALB_DNS\",
          \"EvaluateTargetHealth\": true
        }
      }
    }]
  }"

echo "✅ api.neuralchat.pro настроен!"
```

## 🚨 Частые проблемы

### 1. DNS не резолвится
- Проверьте NS записи в Namecheap
- Подождите до 48 часов для распространения
- Очистите DNS кеш: `ipconfig /flushdns`

### 2. SSL сертификат не работает
- Проверьте валидацию ACM сертификата
- Убедитесь, что CNAME для валидации добавлен
- Проверьте, что ALB использует правильный сертификат

### 3. 502 Bad Gateway
- Проверьте, что ECS tasks запущены
- Проверьте Security Groups (порт 443 открыт)
- Проверьте Target Group health checks

## 📋 Чеклист

- [ ] Выбран метод DNS (Route 53 или Namecheap)
- [ ] NS записи настроены (для Route 53)
- [ ] SSL сертификат создан и валидирован
- [ ] ALB/NLB создан и настроен
- [ ] DNS запись создана (ALIAS или A)
- [ ] HTTPS работает
- [ ] Переменные окружения обновлены
- [ ] Health check endpoint отвечает

---

**Готово!** Ваш API теперь доступен по адресу https://api.neuralchat.pro 🎉 