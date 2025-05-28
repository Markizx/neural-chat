# Clean project from temporary and generated files
Write-Host "Cleaning project..." -ForegroundColor Yellow

# Directories to remove
$dirsToRemove = @(
    "node_modules",
    "dist",
    "build",
    ".next",
    "out",
    "coverage",
    ".nyc_output",
    ".cache",
    ".parcel-cache",
    ".temp",
    "tmp",
    ".amplify",
    "amplify"
)

# Files to remove
$filesToRemove = @(
    "*.log",
    "*.tmp",
    "*.bak",
    "*.orig",
    "yarn.lock",
    "pnpm-lock.yaml",
    "package-lock.json",
    ".DS_Store",
    "Thumbs.db",
    "aws-exports.js"
)

# Remove directories
Write-Host "Removing directories..." -ForegroundColor Cyan
foreach ($dir in $dirsToRemove) {
    Get-ChildItem -Path . -Include $dir -Recurse -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  Removing: $($_.FullName)" -ForegroundColor Red
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Remove files
Write-Host "Removing files..." -ForegroundColor Cyan
foreach ($file in $filesToRemove) {
    Get-ChildItem -Path . -Include $file -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  Removing: $($_.FullName)" -ForegroundColor Red
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    }
}

# Clean npm cache
Write-Host "Cleaning npm cache..." -ForegroundColor Cyan
npm cache clean --force 2>$null

Write-Host "Project cleaned successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To reinstall dependencies, run:" -ForegroundColor Yellow
Write-Host "  npm install" -ForegroundColor White 