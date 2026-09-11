[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

try {
    $host.UI.RawUI.WindowTitle = "企業級專案管理系統 (PMS) 伺服器"
} catch {}

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
    Write-Host "[提示] 尚未檢測到相依套件庫，正在為您安裝 (npm install)..." -ForegroundColor Yellow
    & cmd.exe /c "npm.cmd install"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[錯誤] 套件安裝失敗，請檢查網路連線或錯誤訊息。" -ForegroundColor Red
        Read-Host "按 Enter 鍵結束..."
        exit 1
    }
    Write-Host "[成功] 相依套件安裝完成！" -ForegroundColor Green
    Write-Host ""
}

# 3. 檢查並清理連接埠 3000 與 3001
$ports = @(3000, 3001)
foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        Write-Host "[提示] 正在釋放連接埠 $p 之舊程序..." -ForegroundColor Yellow
        foreach ($c in $conns) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 1

# 4. 啟動 SQLite 後端 API (Port 3001)
Write-Host "[後端啟動] 正在啟動 SQLite 後端 API 服務 (http://localhost:3001)..." -ForegroundColor Cyan
Start-Process "node" -ArgumentList "--import tsx/esm server/index.ts" -WindowStyle Hidden
Start-Sleep -Seconds 1

# 5. 啟動 Vite 前端伺服器 (Port 3000) 並開啟瀏覽器
Write-Host "[前端啟動] 正在開啟本地伺服器並喚醒瀏覽器: http://localhost:3000 ..." -ForegroundColor Green
Remove-Item env:CI -ErrorAction SilentlyContinue

Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    try {
        Start-Process "http://localhost:3000"
    } catch {}
} | Out-Null

& cmd.exe /c "npm.cmd run dev"
