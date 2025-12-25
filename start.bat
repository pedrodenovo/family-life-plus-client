@echo off
title Family Life Plus - Server AI
color 0b

echo ==========================================
echo      FAMILY LIFE PLUS - SERVIDOR IA
echo ==========================================
echo.

:: 1. Verifica se o Node.js esta instalado
.\bin\node-v25.2.1-win-x64\node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo [ERRO] Voce precisa instalar o Node.js primeiro!
    pause
    exit
)

:: 2. Verifica se precisa instalar as bibliotecas
if not exist "node_modules" (
    echo [INFO] Detectei que e a primeira vez. Instalando dependencias...
    call npm install
    echo [OK] Dependencias instaladas!
    echo.
)

:: 3. Inicia o App
echo [INFO] Iniciando o servidor...
echo.
.\bin\node-v25.2.1-win-x64\node app.js

:: 4. Segura a tela se der erro
echo.
color 0e
echo ==========================================
echo [AVISO] O servidor parou de rodar.
echo ==========================================
pause