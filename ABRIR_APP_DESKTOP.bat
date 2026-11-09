@echo off
title Abrindo Aplicativo Veteranos 5 BE Cmb Bld...
set "APP_URL=file:///%~dp0index.html"

:: 1. Tenta abrir no Microsoft Edge em modo Aplicativo Nativo (Janela Independente)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%"
    exit
)

:: 2. Tenta abrir no Google Chrome em modo Aplicativo Nativo
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="%APP_URL%"
    exit
)

:: 3. Se nao encontrar os caminhos padroes, abre no navegador padrao
start "" "%~dp0index.html"
exit
