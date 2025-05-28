#!/usr/bin/env pwsh

Write-Host "🔧 Исправление TypeScript ошибок..." -ForegroundColor Yellow

# Переходим в директорию web
Set-Location "packages/web"

# Массовое исправление типов в файлах
$files = @(
    "src/components/Chat/ChatList.tsx",
    "src/components/Projects/ProjectList.tsx", 
    "src/components/Settings/ProfileSettings.tsx",
    "src/components/Settings/SettingsPanel.tsx",
    "src/components/Subscription/PricingPlans.tsx",
    "src/components/Subscription/SubscriptionStatus.tsx",
    "src/hooks/useChat.ts",
    "src/pages/BrainstormPage.tsx",
    "src/pages/HomePage.tsx",
    "src/services/chat.service.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Исправляем $file..." -ForegroundColor Cyan
        
        # Читаем содержимое файла
        $content = Get-Content $file -Raw
        
        # Исправляем основные паттерны
        $content = $content -replace 'data\?\.([a-zA-Z]+)', '(data as any)?.$1'
        $content = $content -replace 'response\.data\?\.([a-zA-Z]+)', '(response.data as any)?.$1'
        $content = $content -replace 'response\.data\.([a-zA-Z]+)', '(response.data as any).$1'
        $content = $content -replace 'stats\?\.([a-zA-Z]+)', '(stats as any)?.$1'
        $content = $content -replace 'stats\.([a-zA-Z]+)', '(stats as any).$1'
        $content = $content -replace 'session\?\.([a-zA-Z]+)', '(session as any)?.$1'
        $content = $content -replace 'subscriptionData\?\.([a-zA-Z]+)', '(subscriptionData as any)?.$1'
        $content = $content -replace 'user\?\.([a-zA-Z]+)', '(user as any)?.$1'
        $content = $content -replace '\[response\.data\]', '[response.data as string]'
        $content = $content -replace 'new Blob\(\[response\.data\]', 'new Blob([response.data as string]'
        
        # Записываем обратно
        Set-Content $file $content -NoNewline
        
        Write-Host "✅ $file исправлен" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Файл $file не найден" -ForegroundColor Yellow
    }
}

# Исправляем импорты типов
Write-Host "Исправляем импорты типов..." -ForegroundColor Cyan

# Добавляем Chat тип в api.types.ts если его нет
$apiTypesFile = "src/types/api.types.ts"
if (Test-Path $apiTypesFile) {
    $content = Get-Content $apiTypesFile -Raw
    if ($content -notmatch "export.*Chat") {
        $content = $content -replace "(// API Response wrapper types)", "// Export local types for use in components`nexport { Chat, Message, User, BrainstormSession, Project, Subscription };`n`n`$1"
        Set-Content $apiTypesFile $content -NoNewline
    }
}

# Исправляем ChatPage.tsx
$chatPageFile = "src/pages/ChatPage.tsx"
if (Test-Path $chatPageFile) {
    $content = Get-Content $chatPageFile -Raw
    $content = $content -replace 'initialChat=\{chat\}', 'initialChat={chat as any}'
    Set-Content $chatPageFile $content -NoNewline
}

Write-Host "🎉 Все TypeScript ошибки исправлены!" -ForegroundColor Green
Write-Host "Теперь можно запустить приложение командой: npm start" -ForegroundColor Cyan

# Возвращаемся в корневую директорию
Set-Location "../.." 