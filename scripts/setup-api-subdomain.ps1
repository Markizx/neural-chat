# PowerShell скрипт для настройки api.neuralchat.pro
# Требования: AWS CLI установлен и настроен

Write-Host "🚀 Настройка поддомена api.neuralchat.pro" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Выбор метода DNS
Write-Host "`n📊 Выберите метод DNS:" -ForegroundColor Yellow
Write-Host "1. Route 53 (Рекомендуется - $0.50/месяц)" -ForegroundColor Green
Write-Host "2. Namecheap DNS (Бесплатно, но ограничено)" -ForegroundColor Yellow

$dnsChoice = Read-Host "`nВаш выбор (1 или 2)"

if ($dnsChoice -eq "1") {
    Write-Host "`n✅ Выбран Route 53" -ForegroundColor Green
    
    # Проверка существования hosted zone
    Write-Host "`n🔍 Проверяю существование Hosted Zone..." -ForegroundColor Cyan
    $hostedZones = aws route53 list-hosted-zones --query "HostedZones[?Name=='neuralchat.pro.']" | ConvertFrom-Json
    
    if ($hostedZones.Count -eq 0) {
        Write-Host "❌ Hosted Zone не найдена. Создаю..." -ForegroundColor Yellow
        
        # Создание hosted zone
        $callerRef = "setup-$(Get-Date -Format 'yyyyMMddHHmmss')"
        $createResult = aws route53 create-hosted-zone `
            --name neuralchat.pro `
            --caller-reference $callerRef | ConvertFrom-Json
        
        $zoneId = $createResult.HostedZone.Id -replace '/hostedzone/', ''
        Write-Host "✅ Hosted Zone создана: $zoneId" -ForegroundColor Green
        
        # Получение NS записей
        $nsRecords = $createResult.DelegationSet.NameServers
        Write-Host "`n📋 NS записи для Namecheap:" -ForegroundColor Yellow
        foreach ($ns in $nsRecords) {
            Write-Host "   $ns" -ForegroundColor Cyan
        }
        
        Write-Host "`n⚠️  Добавьте эти NS записи в Namecheap:" -ForegroundColor Yellow
        Write-Host "1. Войдите в Namecheap → Domain List → Manage" -ForegroundColor White
        Write-Host "2. Выберите Custom DNS" -ForegroundColor White
        Write-Host "3. Добавьте все 4 NS записи" -ForegroundColor White
        Write-Host "4. Подождите 1-48 часов для распространения DNS" -ForegroundColor White
        
        $continue = Read-Host "`nНажмите Enter когда добавите NS записи в Namecheap"
    } else {
        $zoneId = $hostedZones[0].Id -replace '/hostedzone/', ''
        Write-Host "✅ Hosted Zone найдена: $zoneId" -ForegroundColor Green
    }
    
    # Проверка ALB
    Write-Host "`n🔍 Проверяю наличие ALB..." -ForegroundColor Cyan
    $albName = Read-Host "Введите имя вашего ALB (или оставьте пустым для создания нового)"
    
    if ([string]::IsNullOrWhiteSpace($albName)) {
        Write-Host "⚠️  Для создания ALB необходимо сначала развернуть ECS с API" -ForegroundColor Yellow
        Write-Host "Инструкции в файле LAUNCH_GUIDE.md" -ForegroundColor Yellow
        exit
    }
    
    # Получение данных ALB
    $albInfo = aws elbv2 describe-load-balancers --names $albName | ConvertFrom-Json
    if ($albInfo.LoadBalancers.Count -eq 0) {
        Write-Host "❌ ALB не найден: $albName" -ForegroundColor Red
        exit
    }
    
    $albDns = $albInfo.LoadBalancers[0].DNSName
    $albZone = $albInfo.LoadBalancers[0].CanonicalHostedZoneId
    Write-Host "✅ ALB найден: $albDns" -ForegroundColor Green
    
    # Создание SSL сертификата
    Write-Host "`n🔐 Создаю SSL сертификат..." -ForegroundColor Cyan
    $certArn = aws acm request-certificate `
        --domain-name api.neuralchat.pro `
        --validation-method DNS `
        --region us-east-1 `
        --query CertificateArn `
        --output text
    
    Write-Host "✅ Сертификат запрошен: $certArn" -ForegroundColor Green
    
    # Ожидание появления данных для валидации
    Write-Host "⏳ Ожидаю данные для валидации..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Получение CNAME для валидации
    $validationData = aws acm describe-certificate `
        --certificate-arn $certArn `
        --region us-east-1 | ConvertFrom-Json
    
    $validationCname = $validationData.Certificate.DomainValidationOptions[0].ResourceRecord
    
    if ($validationCname) {
        Write-Host "`n📝 Добавляю CNAME для валидации SSL..." -ForegroundColor Cyan
        
        $changeBatch = @{
            Changes = @(
                @{
                    Action = "CREATE"
                    ResourceRecordSet = @{
                        Name = $validationCname.Name
                        Type = $validationCname.Type
                        TTL = 300
                        ResourceRecords = @(
                            @{ Value = $validationCname.Value }
                        )
                    }
                }
            )
        } | ConvertTo-Json -Depth 10
        
        aws route53 change-resource-record-sets `
            --hosted-zone-id $zoneId `
            --change-batch $changeBatch
        
        Write-Host "✅ CNAME для валидации добавлен" -ForegroundColor Green
    }
    
    # Создание ALIAS записи
    Write-Host "`n📝 Создаю ALIAS запись для api.neuralchat.pro..." -ForegroundColor Cyan
    
    $changeBatch = @{
        Changes = @(
            @{
                Action = "UPSERT"
                ResourceRecordSet = @{
                    Name = "api.neuralchat.pro"
                    Type = "A"
                    AliasTarget = @{
                        HostedZoneId = $albZone
                        DNSName = $albDns
                        EvaluateTargetHealth = $true
                    }
                }
            }
        )
    } | ConvertTo-Json -Depth 10
    
    aws route53 change-resource-record-sets `
        --hosted-zone-id $zoneId `
        --change-batch $changeBatch
    
    Write-Host "✅ ALIAS запись создана!" -ForegroundColor Green
    
} elseif ($dnsChoice -eq "2") {
    Write-Host "`n✅ Выбран Namecheap DNS" -ForegroundColor Green
    Write-Host "`n⚠️  Для Namecheap DNS требуется:" -ForegroundColor Yellow
    Write-Host "1. Network Load Balancer (NLB) вместо ALB" -ForegroundColor White
    Write-Host "2. Elastic IP ($3.60/месяц)" -ForegroundColor White
    Write-Host "3. Ручная настройка SSL через Let's Encrypt" -ForegroundColor White
    
    $continue = Read-Host "`nПродолжить? (y/n)"
    if ($continue -ne "y") {
        exit
    }
    
    # Создание Elastic IP
    Write-Host "`n📝 Создаю Elastic IP..." -ForegroundColor Cyan
    $eipResult = aws ec2 allocate-address --domain vpc | ConvertFrom-Json
    $elasticIp = $eipResult.PublicIp
    $allocationId = $eipResult.AllocationId
    
    Write-Host "✅ Elastic IP создан: $elasticIp" -ForegroundColor Green
    
    Write-Host "`n📋 Инструкции для Namecheap:" -ForegroundColor Yellow
    Write-Host "1. Войдите в Namecheap → Domain List → Manage" -ForegroundColor White
    Write-Host "2. Advanced DNS → Add New Record" -ForegroundColor White
    Write-Host "3. Type: A Record" -ForegroundColor White
    Write-Host "4. Host: api" -ForegroundColor White
    Write-Host "5. Value: $elasticIp" -ForegroundColor White
    Write-Host "6. TTL: Automatic" -ForegroundColor White
    
    Write-Host "`n⚠️  Далее необходимо:" -ForegroundColor Yellow
    Write-Host "1. Создать Network Load Balancer" -ForegroundColor White
    Write-Host "2. Привязать Elastic IP к NLB" -ForegroundColor White
    Write-Host "3. Настроить SSL через Let's Encrypt на EC2" -ForegroundColor White
    
} else {
    Write-Host "❌ Неверный выбор" -ForegroundColor Red
    exit
}

# Проверка DNS
Write-Host "`n🔍 Проверка DNS (может занять время)..." -ForegroundColor Cyan
Write-Host "Используйте эти команды для проверки:" -ForegroundColor Yellow
Write-Host "  nslookup api.neuralchat.pro" -ForegroundColor White
Write-Host "  Resolve-DnsName api.neuralchat.pro" -ForegroundColor White
Write-Host "  curl -I https://api.neuralchat.pro/health" -ForegroundColor White

Write-Host "`n📝 Не забудьте обновить переменные окружения:" -ForegroundColor Yellow
Write-Host "Frontend: REACT_APP_API_URL=https://api.neuralchat.pro" -ForegroundColor White
Write-Host "Admin: NEXT_PUBLIC_API_URL=https://api.neuralchat.pro" -ForegroundColor White

Write-Host "`n✅ Настройка завершена!" -ForegroundColor Green
Write-Host "📖 Подробная документация: API_SUBDOMAIN_SETUP.md" -ForegroundColor Cyan 