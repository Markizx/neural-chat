# Автоматическая чистая установка NeuralChat
# Использование: .\scripts\install-clean.ps1

param(
    [string]$TargetPath = "C:\Users\PC\Downloads\neuralchat-clean"
)

Write-Host "🚀 Чистая установка NeuralChat" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Проверка Node.js версии
Write-Host "`n📋 Проверка версии Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js версия: $nodeVersion" -ForegroundColor Green
    
    if ($nodeVersion -lt "v18.0.0") {
        Write-Host "⚠️  Рекомендуется Node.js версия 18.0.0 или выше" -ForegroundColor Yellow
        Write-Host "Скачайте с https://nodejs.org/" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Node.js не найден! Установите Node.js с https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Проверка npm версии
try {
    $npmVersion = npm --version
    Write-Host "npm версия: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm не найден!" -ForegroundColor Red
    exit 1
}

# Создание новой директории
Write-Host "`n📁 Создание новой директории..." -ForegroundColor Cyan
if (Test-Path $TargetPath) {
    $overwrite = Read-Host "Директория $TargetPath уже существует. Перезаписать? (y/n)"
    if ($overwrite -eq "y") {
        Remove-Item -Recurse -Force $TargetPath
        Write-Host "✅ Старая директория удалена" -ForegroundColor Green
    } else {
        Write-Host "❌ Установка отменена" -ForegroundColor Red
        exit 1
    }
}

# Копирование проекта
Write-Host "📋 Копирование проекта..." -ForegroundColor Cyan
$currentPath = Get-Location
Copy-Item -Recurse $currentPath $TargetPath
Write-Host "✅ Проект скопирован в $TargetPath" -ForegroundColor Green

# Переход в новую директорию
Set-Location $TargetPath
Write-Host "📂 Перешли в $TargetPath" -ForegroundColor Green

# Очистка старых зависимостей
Write-Host "`n🧹 Очистка старых файлов..." -ForegroundColor Yellow

# Удаление node_modules
$nodeModulesPaths = @(
    "node_modules",
    "packages/api/node_modules",
    "packages/web/node_modules", 
    "packages/admin/node_modules",
    "packages/shared/node_modules",
    "packages/ui-kit/node_modules"
)

foreach ($path in $nodeModulesPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "✅ $path удален" -ForegroundColor Green
    }
}

# Удаление lock файлов
$lockFiles = @(
    "package-lock.json",
    "packages/api/package-lock.json",
    "packages/web/package-lock.json",
    "packages/admin/package-lock.json",
    "packages/shared/package-lock.json",
    "packages/ui-kit/package-lock.json"
)

foreach ($file in $lockFiles) {
    if (Test-Path $file) {
        Remove-Item -Force $file
        Write-Host "✅ $file удален" -ForegroundColor Green
    }
}

# Очистка npm кеша
Write-Host "`n🧹 Очистка npm кеша..." -ForegroundColor Cyan
npm cache clean --force

# Создание .npmrc если не существует
if (-not (Test-Path ".npmrc")) {
    Write-Host "`n📝 Создание .npmrc..." -ForegroundColor Cyan
    $npmrcContent = @"
legacy-peer-deps=true
fund=false
audit=false
save-exact=false
package-lock=true
"@
    $npmrcContent | Out-File -FilePath ".npmrc" -Encoding UTF8
    Write-Host "✅ .npmrc создан" -ForegroundColor Green
}

# Установка зависимостей
Write-Host "`n📦 Установка зависимостей..." -ForegroundColor Cyan
Write-Host "Это может занять несколько минут..." -ForegroundColor Yellow

# Попытка 1: legacy-peer-deps
Write-Host "`n🔄 Попытка 1: npm install --legacy-peer-deps" -ForegroundColor Yellow
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Установка завершена успешно с --legacy-peer-deps!" -ForegroundColor Green
    $installSuccess = $true
} else {
    Write-Host "⚠️ Ошибка с --legacy-peer-deps, пробую --force..." -ForegroundColor Yellow
    
    # Попытка 2: force
    Write-Host "`n🔄 Попытка 2: npm install --force" -ForegroundColor Yellow
    npm install --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Установка завершена с --force!" -ForegroundColor Green
        $installSuccess = $true
    } else {
        Write-Host "⚠️ npm install не удался, пробую yarn..." -ForegroundColor Yellow
        
        # Попытка 3: yarn
        try {
            yarn --version | Out-Null
            Write-Host "`n🔄 Попытка 3: yarn install" -ForegroundColor Yellow
            yarn install
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Установка завершена с yarn!" -ForegroundColor Green
                $installSuccess = $true
            } else {
                $installSuccess = $false
            }
        } catch {
            Write-Host "❌ yarn не найден" -ForegroundColor Red
            $installSuccess = $false
        }
    }
}

# Проверка результата установки
if ($installSuccess) {
    Write-Host "`n🔍 Проверка установки..." -ForegroundColor Cyan
    
    # Проверка node_modules
    if (Test-Path "node_modules") {
        Write-Host "✅ node_modules создан" -ForegroundColor Green
    } else {
        Write-Host "❌ node_modules не найден" -ForegroundColor Red
    }
    
    # Проверка TypeScript
    try {
        $tsVersion = npx tsc --version
        Write-Host "✅ TypeScript: $tsVersion" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ TypeScript не найден" -ForegroundColor Yellow
    }
    
    # Создание .env файлов из примеров
    Write-Host "`n📝 Создание .env файлов..." -ForegroundColor Cyan
    $envMappings = @{
        "packages/api/env.example" = "packages/api/.env"
        "packages/web/env.example" = "packages/web/.env"
        "packages/admin/env.example" = "packages/admin/.env"
    }
    
    foreach ($mapping in $envMappings.GetEnumerator()) {
        if (Test-Path $mapping.Key) {
            if (-not (Test-Path $mapping.Value)) {
                Copy-Item $mapping.Key $mapping.Value
                Write-Host "✅ $($mapping.Value) создан из примера" -ForegroundColor Green
            } else {
                Write-Host "ℹ️ $($mapping.Value) уже существует" -ForegroundColor Blue
            }
        }
    }
    
    # Финальные инструкции
    Write-Host "`n🎉 Чистая установка завершена успешно!" -ForegroundColor Green
    Write-Host "`n📋 Следующие шаги:" -ForegroundColor Yellow
    Write-Host "1. Настройте .env файлы с вашими API ключами:" -ForegroundColor White
    Write-Host "   - packages/api/.env (MongoDB, Claude, Grok ключи)" -ForegroundColor White
    Write-Host "   - packages/web/.env (API URL)" -ForegroundColor White
    Write-Host "2. Запустите проект: npm run dev" -ForegroundColor White
    Write-Host "3. Откройте браузер: http://localhost:3000" -ForegroundColor White
    
    Write-Host "`n📖 Документация:" -ForegroundColor Cyan
    Write-Host "- ENV_SETUP.md - настройка переменных окружения" -ForegroundColor White
    Write-Host "- QUICK_START.md - быстрый старт" -ForegroundColor White
    Write-Host "- LAUNCH_GUIDE.md - полное руководство" -ForegroundColor White
    
    Write-Host "`n📂 Текущая директория: $TargetPath" -ForegroundColor Cyan
    
} else {
    Write-Host "`n❌ Установка не удалась!" -ForegroundColor Red
    Write-Host "`n💡 Попробуйте ручную установку:" -ForegroundColor Yellow
    Write-Host "1. cd `"$TargetPath`"" -ForegroundColor White
    Write-Host "2. npm install --legacy-peer-deps" -ForegroundColor White
    Write-Host "3. Если не работает: npm install --force" -ForegroundColor White
    Write-Host "4. Или установите yarn: npm install -g yarn && yarn install" -ForegroundColor White
}

# Возврат в исходную директорию
Set-Location $currentPath 