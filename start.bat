@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 企業級專案管理系統伺服器

echo ===================================================
echo   企業級專案管理系統 - 本地啟動腳本
echo ===================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [錯誤] 系統未檢測到 Node.js 環境！
    echo 請先至 Node.js 官方網站下載安裝 LTS 版本: https://nodejs.org/
    echo 安裝完成後，請重新執行此腳本。
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [提示] 尚未檢測到相依套件庫，正在自動為您安裝 (npm install)...
    call npm.cmd install
    if %ERRORLEVEL% neq 0 (
        echo [錯誤] 套件安裝失敗，請檢查網路連線或權限後重試。
        pause
        exit /b 1
    )
    echo [成功] 相依套件安裝完成！
    echo.
)

echo [提示] 正在檢查並釋放連接埠 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command " = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if () { foreach ( in .OwningProcess) { Stop-Process -Id  -Force -ErrorAction SilentlyContinue } }" >nul 2>nul

echo [啟動中] 正在開啟本地伺服器並喚醒瀏覽器: http://localhost:3000 ...
start http://localhost:3000

echo.
echo ===================================================
echo   [運行中] 本地服務已順利啟動！
echo   本地網址: http://localhost:3000
echo   若要關閉服務，可執行 stop.bat 或直接關閉此視窗。
echo ===================================================
echo.

call npm.cmd run dev