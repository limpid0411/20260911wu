[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  正在啟動 企業級專案管理系統 (Enterprise PMS)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# 1. 檢查 Node.js 是否安裝
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[錯誤] 系統未檢測到 Node.js 環境！" -ForegroundColor Red
    Write-Host "請先前往官方網站下載並安裝 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按 Enter 鍵結束..."
    exit 1
}

# 2. 檢查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "[提示] 正在為您安裝專案相依套件 (npm install)..." -ForegroundColor Yellow
    & cmd.exe /c "npm.cmd install"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[錯誤] 套件安裝失敗，請檢查網路連線或錯誤訊息。" -ForegroundColor Red
        Read-Host "按 Enter 鍵結束..."
        exit 1
    }
    Write-Host "[成功] 相依套件安裝完成！" -ForegroundColor Green
    Write-Host ""
}

# 3. 檢查連接埠 3000 是否被佔用
$port = 3000
$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($conns) {
    Write-Host "[提示] 偵測到連接埠 $port 目前有舊程序在運行，正在為您重置..." -ForegroundColor Yellow
    foreach ($c in $conns) {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# 4. 啟動 Vite 開發伺服器
Write-Host "[啟動中] 正在開啟本地伺服器 (http://localhost:$port)..." -ForegroundColor Green
$env:CI = "true"
Start-Process "http://localhost:$port"
& cmd.exe /c "npm.cmd run dev"
