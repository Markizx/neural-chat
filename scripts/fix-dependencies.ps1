# PowerShell скрипт для исправления проблем с зависимостями
# Исправляет конфликты TypeScript и react-scripts

Write-Host "🔧 Исправление проблем с зависимостями NeuralChat" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Проверка Node.js версии
Write-Host "`n📋 Проверка версии Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node.js версия: $nodeVersion" -ForegroundColor Green

if ($nodeVersion -lt "v18.0.0") {
    Write-Host "⚠️  Рекомендуется Node.js версия 18.0.0 или выше" -ForegroundColor Yellow
    Write-Host "Скачайте с https://nodejs.org/" -ForegroundColor White
}

# Очистка кеша npm
Write-Host "`n🧹 Очистка npm кеша..." -ForegroundColor Cyan
npm cache clean --force

# Удаление node_modules и package-lock.json
Write-Host "`n🗑️  Удаление старых зависимостей..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ node_modules удален" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ package-lock.json удален" -ForegroundColor Green
}

# Удаление node_modules в пакетах
$packages = @("packages/api", "packages/web", "packages/admin", "packages/shared", "packages/ui-kit")
foreach ($package in $packages) {
    if (Test-Path "$package/node_modules") {
        Remove-Item -Recurse -Force "$package/node_modules"
        Write-Host "✅ $package/node_modules удален" -ForegroundColor Green
    }
    if (Test-Path "$package/package-lock.json") {
        Remove-Item -Force "$package/package-lock.json"
        Write-Host "✅ $package/package-lock.json удален" -ForegroundColor Green
    }
}

# Установка с legacy-peer-deps
Write-Host "`n📦 Установка зависимостей с --legacy-peer-deps..." -ForegroundColor Cyan
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Зависимости установлены успешно!" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при установке зависимостей" -ForegroundColor Red
    Write-Host "`n🔄 Пробую альтернативный метод..." -ForegroundColor Yellow
    
    # Альтернативный метод с force
    npm install --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Зависимости установлены с --force!" -ForegroundColor Green
    } else {
        Write-Host "❌ Не удалось установить зависимости" -ForegroundColor Red
        Write-Host "`n💡 Попробуйте ручную установку:" -ForegroundColor Yellow
        Write-Host "1. npm install --legacy-peer-deps" -ForegroundColor White
        Write-Host "2. npm install --force" -ForegroundColor White
        Write-Host "3. Или используйте yarn вместо npm" -ForegroundColor White
        exit 1
    }
}

# Проверка установки
Write-Host "`n🔍 Проверка установки..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules создан" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules не найден" -ForegroundColor Red
}

# Проверка TypeScript версии
Write-Host "`n📋 Проверка версии TypeScript..." -ForegroundColor Yellow
try {
    $tsVersion = npx tsc --version
    Write-Host "TypeScript версия: $tsVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  TypeScript не найден" -ForegroundColor Yellow
}

# Проверка react-scripts
Write-Host "`n📋 Проверка react-scripts..." -ForegroundColor Yellow
try {
    $reactScriptsVersion = npm list react-scripts --depth=0 2>$null
    if ($reactScriptsVersion -match "react-scripts@") {
        Write-Host "✅ react-scripts установлен" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  react-scripts не найден в корне" -ForegroundColor Yellow
}

# Создание .npmrc для будущих установок
Write-Host "`n📝 Создание .npmrc..." -ForegroundColor Cyan
$npmrcContent = @"
legacy-peer-deps=true
fund=false
audit=false
"@

$npmrcContent | Out-File -FilePath ".npmrc" -Encoding UTF8
Write-Host "✅ .npmrc создан с legacy-peer-deps=true" -ForegroundColor Green

# Проверка env файлов
Write-Host "`n🔍 Проверка .env файлов..." -ForegroundColor Cyan
$envFiles = @(
    "packages/api/.env",
    "packages/web/.env", 
    "packages/admin/.env"
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

Write-Host "`n🎉 Исправление зависимостей завершено!" -ForegroundColor Green
Write-Host "`n📋 Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Настройте .env файлы с вашими API ключами" -ForegroundColor White
Write-Host "2. Запустите: npm run dev" -ForegroundColor White
Write-Host "3. Если проблемы остались, используйте: npm run dev --legacy-peer-deps" -ForegroundColor White

Write-Host "`n📖 Документация:" -ForegroundColor Cyan
Write-Host "- ENV_SETUP.md - настройка переменных окружения" -ForegroundColor White
Write-Host "- QUICK_START.md - быстрый старт" -ForegroundColor White
Write-Host "- LAUNCH_GUIDE.md - полное руководство" -ForegroundColor White 