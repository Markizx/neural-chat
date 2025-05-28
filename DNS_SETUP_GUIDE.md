# 🌐 Настройка DNS для NeuralChat

## Вариант 1: Route 53 + Namecheap (Рекомендуется) ✅

### Шаг 1: Создание Hosted Zone в Route 53
1. Откройте AWS Console → Route 53
2. **Create hosted zone**
3. Domain name: `neuralchat.pro`
4. Type: **Public hosted zone**
5. Нажмите **Create hosted zone**

### Шаг 2: Получите NS записи
После создания вы увидите 4 NS записи, например:
```
ns-1234.awsdns-12.org
ns-5678.awsdns-34.com
ns-9012.awsdns-56.net
ns-3456.awsdns-78.co.uk
```

### Шаг 3: Настройте Namecheap
1. Войдите в Namecheap → Domain List → Manage
2. Выберите **Custom DNS** (не Namecheap BasicDNS!)
3. Добавьте все 4 NS записи из Route 53:
   - ns-1234.awsdns-12.org
   - ns-5678.awsdns-34.com
   - ns-9012.awsdns-56.net
   - ns-3456.awsdns-78.co.uk
4. Сохраните изменения

### Шаг 4: Подождите распространения DNS
⏱️ Это может занять от 5 минут до 48 часов (обычно 1-2 часа)

### Шаг 5: Создайте записи в Route 53

#### Для AWS Amplify (Frontend):
1. В Amplify Console → Domain management → Add domain
2. Выберите `neuralchat.pro`
3. Amplify автоматически создаст записи в Route 53

#### Для ECS/ALB (Backend API):
После создания ALB получите его DNS имя и создайте в Route 53:
```
Type    Name                Value                                   TTL
A       api.neuralchat.pro  ALIAS → выберите ваш ALB               -
```

## Вариант 2: Только Namecheap DNS ⚠️

### ⚠️ Ограничения:
- Нет ALIAS записей (только CNAME)
- Нет автоматической интеграции с AWS
- Сложнее с SSL сертификатами

### Если выбрали этот вариант:

1. **Получите IP адреса:**
   - Для Amplify: используйте CloudFront distribution
   - Для ECS: создайте Elastic IP и привяжите к ALB

2. **В Namecheap Advanced DNS добавьте:**
```
Type    Host    Value                           TTL
CNAME   @       d1234567.cloudfront.net         Automatic
CNAME   www     d1234567.cloudfront.net         Automatic
A       api     54.123.45.67 (Elastic IP)       Automatic
CNAME   admin   d7890123.cloudfront.net         Automatic
```

## 📊 Сравнение вариантов:

| Функция | Route 53 | Namecheap DNS |
|---------|----------|---------------|
| ALIAS записи | ✅ | ❌ |
| Автоматическая интеграция | ✅ | ❌ |
| Health checks | ✅ | ❌ |
| Геолокация | ✅ | ❌ |
| Стоимость | $0.50/месяц за зону | Бесплатно |
| Скорость обновления | Секунды | Минуты |

## 🚀 Рекомендуемый подход:

### 1. Создайте Hosted Zone в Route 53
```bash
aws route53 create-hosted-zone \
  --name neuralchat.pro \
  --caller-reference $(date +%s)
```

### 2. Обновите NS записи в Namecheap

### 3. Используйте AWS Certificate Manager для SSL
```bash
aws acm request-certificate \
  --domain-name neuralchat.pro \
  --subject-alternative-names "*.neuralchat.pro" \
  --validation-method DNS
```

### 4. Настройте записи через Terraform (опционально)
```hcl
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.neuralchat.pro"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}
```

## 🔍 Как проверить, что DNS работает:

### Windows:
```cmd
nslookup neuralchat.pro
nslookup api.neuralchat.pro
```

### Онлайн инструменты:
- https://dnschecker.org
- https://mxtoolbox.com/DNSLookup.aspx

## ⏱️ Временная шкала:

1. **0-5 минут**: Записи появляются в Route 53
2. **5-120 минут**: NS записи распространяются от Namecheap
3. **2-48 часов**: Полное глобальное распространение

## 💡 Советы:

1. **Не удаляйте старые NS записи** сразу - подождите 48 часов
2. **Используйте низкий TTL** (300 секунд) при миграции
3. **Проверяйте из разных локаций** - DNS кешируется
4. **Настройте мониторинг** Route 53 Health Checks

---

**Итог**: Используйте Route 53 для полной интеграции с AWS сервисами. Это стоит $0.50/месяц, но сэкономит часы настройки и проблем. 