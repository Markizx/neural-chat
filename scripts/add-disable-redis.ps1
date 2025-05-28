# Скрипт для добавления DISABLE_REDIS=true в .env файл API

Write-Host "🔧 Добавление DISABLE_REDIS=true в API .env файл..." -ForegroundColor Cyan

$apiEnvPath = "packages/api/.env"

if (Test-Path $apiEnvPath) {
    $envContent = Get-Content $apiEnvPath -Raw
    
    if ($envContent -match "DISABLE_REDIS") {
        Write-Host "✅ DISABLE_REDIS уже существует в $apiEnvPath" -ForegroundColor Green
        
        # Проверяем значение
        if ($envContent -match "DISABLE_REDIS=true") {
            Write-Host "✅ DISABLE_REDIS уже установлен в true" -ForegroundColor Green
        } else {
            Write-Host "⚠️  DISABLE_REDIS найден, но не установлен в true. Исправляю..." -ForegroundColor Yellow
            $envContent = $envContent -replace "DISABLE_REDIS=.*", "DISABLE_REDIS=true"
            Set-Content $apiEnvPath $envContent
            Write-Host "✅ DISABLE_REDIS установлен в true" -ForegroundColor Green
        }
    } else {
        Write-Host "➕ Добавляю DISABLE_REDIS=true в $apiEnvPath" -ForegroundColor Yellow
        
        # Добавляем после секции Redis
        if ($envContent -match "# Redis") {
            $envContent = $envContent -replace "(# Redis.*\nREDIS_URL=.*)", "`$1`nDISABLE_REDIS=true"
        } else {
            # Добавляем в конец файла
            Add-Content $apiEnvPath "`n# Redis (отключен для локальной разработки)`nDISABLE_REDIS=true"
        }
        
        Write-Host "✅ DISABLE_REDIS=true добавлен в $apiEnvPath" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Файл $apiEnvPath не найден!" -ForegroundColor Red
    Write-Host "💡 Сначала создайте .env файл из env.example:" -ForegroundColor Yellow
    Write-Host "Copy-Item packages/api/env.example packages/api/.env" -ForegroundColor White
    exit 1
}

Write-Host "`n🎉 Готово! Теперь API будет работать без Redis" -ForegroundColor Green
Write-Host "💡 Можете запускать: npm run dev:core" -ForegroundColor Cyan 