@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===================================================
echo   正在背景啟動 企業級專案管理系統 (Enterprise PMS)
echo ===================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [錯誤] 系統未檢測到 Node.js，請先安裝: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [提示] 尚未安裝相依套件，正在自動安裝 (npm install)...
    call npm.cmd install
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if ($c) { foreach ($p in $c.OwningProcess) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } }; $env:CI='true'; Start-Process node.exe -ArgumentList 'node_modules/vite/bin/vite.js' -WorkingDirectory '%~dp0' -WindowStyle Hidden; Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000'"

echo [成功] 服務已在背景啟動！已為您開啟 http://localhost:3000
echo 若要關閉服務，請執行 stop.bat
timeout /t 3 >nul
