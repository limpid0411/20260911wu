@echo off
cd /d "%~dp0"
title Enterprise_PMS_Server
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"