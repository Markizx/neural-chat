# Update documentation files
Write-Host "Updating documentation..." -ForegroundColor Green

# Function to replace text in files
function Replace-InFile {
    param(
        [string]$file,
        [string]$search,
        [string]$replace
    )
    
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace [regex]::Escape($search), $replace
        Set-Content -Path $file -Value $content -NoNewline
    }
}

# Update getting-started.md
Write-Host "Updating getting-started.md..."
$file = "docs/getting-started.md"
if (Test-Path $file) {
    Replace-InFile -file $file -search "SmartChat.ai" -replace "NeuralChat"
    Replace-InFile -file $file -search "SmartChat" -replace "NeuralChat"
    Replace-InFile -file $file -search "smartchat.ai" -replace "neuralchat.pro"
    Replace-InFile -file $file -search "smartchat-ai/smartchat-platform" -replace "neuralchat/neuralchat-platform"
    Replace-InFile -file $file -search "smartchat-platform" -replace "neuralchat-platform"
    Replace-InFile -file $file -search "smartchat/" -replace "neuralchat/"
    Replace-InFile -file $file -search "@smartchat/" -replace "@neuralchat/"
}

# Update all markdown files in docs
Write-Host "Updating all markdown files in docs..."
Get-ChildItem -Path "docs" -Filter "*.md" -Recurse | ForEach-Object {
    $file = $_.FullName
    Write-Host "  Updating: $($_.Name)"
    
    Replace-InFile -file $file -search "SmartChat" -replace "NeuralChat"
    Replace-InFile -file $file -search "smartchat" -replace "neuralchat"
    Replace-InFile -file $file -search "@smartchat/" -replace "@neuralchat/"
}

Write-Host "Documentation updated successfully!" -ForegroundColor Green 