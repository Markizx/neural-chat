# Простой запуск основных компонентов NeuralChat
# Запускает только API и Web без UI-Kit и Admin

Write-Host "🚀 Запуск NeuralChat (упрощенный режим)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Проверка .env файлов
Write-Host "`n📝 Проверка .env файлов..." -ForegroundColor Yellow

$envFiles = @(
    "packages/api/.env",
    "packages/web/.env"
)

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "✅ $envFile существует" -ForegroundColor Green
    } else {
        $exampleFile = $envFile -replace "\.env$", ".env.example"
        if (Test-Path $exampleFile) {
            Copy-Item $exampleFile $envFile
            Write-Host "✅ $envFile создан из примера" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $envFile не найден" -ForegroundColor Yellow
        }
    }
}

# Добавляем DISABLE_REDIS в API .env если его нет
$apiEnvPath = "packages/api/.env"
if (Test-Path $apiEnvPath) {
    $envContent = Get-Content $apiEnvPath -Raw
    if ($envContent -notmatch "DISABLE_REDIS") {
        Add-Content $apiEnvPath "`nDISABLE_REDIS=true"
        Write-Host "✅ Добавлен DISABLE_REDIS=true в API .env" -ForegroundColor Green
    }
}

Write-Host "`n🚀 Запуск сервисов..." -ForegroundColor Cyan
Write-Host "Это запустит:" -ForegroundColor Yellow
Write-Host "- API сервер на http://localhost:5000" -ForegroundColor White
Write-Host "- Frontend на http://localhost:3000" -ForegroundColor White

# Запуск в фоновых процессах
Write-Host "`n📦 Запуск API сервера..." -ForegroundColor Cyan
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd packages/api
    npm run dev
}

Write-Host "📦 Запуск Frontend..." -ForegroundColor Cyan
$webJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd packages/web
    npm run dev
}

Write-Host "`n✅ Сервисы запускаются..." -ForegroundColor Green
Write-Host "📋 Статус:" -ForegroundColor Yellow
Write-Host "- API Job ID: $($apiJob.Id)" -ForegroundColor White
Write-Host "- Web Job ID: $($webJob.Id)" -ForegroundColor White

Write-Host "`n🌐 URL адреса:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "- API: http://localhost:5000" -ForegroundColor Green
Write-Host "- API Docs: http://localhost:5000/api-docs" -ForegroundColor Green

Write-Host "`n📝 Управление:" -ForegroundColor Yellow
Write-Host "- Для просмотра логов API: Receive-Job $($apiJob.Id) -Keep" -ForegroundColor White
Write-Host "- Для просмотра логов Web: Receive-Job $($webJob.Id) -Keep" -ForegroundColor White
Write-Host "- Для остановки: Stop-Job $($apiJob.Id), $($webJob.Id)" -ForegroundColor White

Write-Host "`n⏳ Ожидание запуска (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Проверка статуса
Write-Host "`n🔍 Проверка статуса сервисов..." -ForegroundColor Cyan

$apiStatus = Get-Job $apiJob.Id
$webStatus = Get-Job $webJob.Id

Write-Host "API Status: $($apiStatus.State)" -ForegroundColor $(if($apiStatus.State -eq 'Running') {'Green'} else {'Red'})
Write-Host "Web Status: $($webStatus.State)" -ForegroundColor $(if($webStatus.State -eq 'Running') {'Green'} else {'Red'})

# Показываем последние логи
Write-Host "`n📋 Последние логи API:" -ForegroundColor Cyan
Receive-Job $apiJob.Id -Keep | Select-Object -Last 5

Write-Host "`n📋 Последние логи Web:" -ForegroundColor Cyan
Receive-Job $webJob.Id -Keep | Select-Object -Last 5

Write-Host "`n🎉 Готово! Откройте http://localhost:3000 в браузере" -ForegroundColor Green
Write-Host "`n💡 Для остановки всех сервисов запустите:" -ForegroundColor Yellow
Write-Host "Stop-Job $($apiJob.Id), $($webJob.Id); Remove-Job $($apiJob.Id), $($webJob.Id)" -ForegroundColor White 