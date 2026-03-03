@echo off
REM Script para converter Kart Point Pitch para PDF
REM Requer Node.js e npm instalado

echo.
echo ========================================
echo   KART POINT PITCH - EXPORTAR PARA PDF
echo ========================================
echo.

REM Verifica se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erro: Node.js nao esta instalado!
    echo.
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verifica se puppeteer está instalado
if not exist "node_modules\puppeteer" (
    echo Instalando Puppeteer...
    npm install puppeteer
)

echo.
echo Gerando PDF do site...
echo.

node export-pdf.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   arquivo gerado: Kart-Point-Pitch.pdf
    echo ========================================
    echo.
    pause
) else (
    echo.
    echo Erro ao gerar PDF!
    pause
    exit /b 1
)
