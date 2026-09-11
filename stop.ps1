[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  正在停止 企業級專案管理系統 (Enterprise PMS)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

$ports = @(3000, 3001)
$killed = $false

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($c in $conns) {
            $pidToKill = $c.OwningProcess
            Write-Host "[關閉中] 正在終止監聽連接埠 $port 之程序 (PID: $pidToKill)..." -ForegroundColor Yellow
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            $killed = $true
        }
    }
}

# 關閉可能殘留的伺服器終端視窗
& cmd.exe /c "taskkill /F /FI ""WINDOWTITLE eq 企業級專案管理系統*"" >nul 2>nul"
& cmd.exe /c "taskkill /F /FI ""WINDOWTITLE eq Enterprise_PMS*"" >nul 2>nul"

if ($killed) {
    Write-Host "[成功] 前端伺服器 (3000) 與 SQLite 後端 API (3001) 已成功停止！" -ForegroundColor Green
} else {
    Write-Host "[提示] 目前沒有正在運行的服務（連接埠 3000 與 3001 未被佔用）。" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 2
