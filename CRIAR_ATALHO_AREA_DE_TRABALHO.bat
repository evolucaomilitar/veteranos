@echo off
title Criando Atalho na Area de Trabalho...
echo =======================================================
echo   CRIANDO ATALHO DO APLICATIVO - VETERANOS 5 BE CMB BLD
echo =======================================================
echo.

set "TARGET_DIR=%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::ExpandEnvironmentVariables('%%USERPROFILE%%\Desktop'); if (-not (Test-Path $d)) { $d = [System.Environment]::GetFolderPath('Desktop') }; $sc = $ws.CreateShortcut((Join-Path $d 'Veteranos 5 BE.lnk')); $sc.TargetPath = '%TARGET_DIR%ABRIR_APP_DESKTOP.bat'; $sc.WorkingDirectory = '%TARGET_DIR%'; $sc.Description = 'Aplicativo Veteranos 5 BE - Batalhao Juarez Tavora'; $sc.IconLocation = '%TARGET_DIR%icon-512.png'; $sc.Save(); Write-Host 'Atalho criado com sucesso na sua Area de Trabalho!'"

echo.
echo =======================================================
echo Concluido! O atalho 'Veteranos 5 BE' foi criado na sua Area de Trabalho!
echo =======================================================
timeout /t 5 >nul
exit
