@echo off
title Na Tua Presenca - 365 dias com Deus
cd /d "%~dp0backend"

where python >nul 2>nul
if errorlevel 1 (
    where py >nul 2>nul
    if errorlevel 1 (
        echo Python nao encontrado. Instala em python.org
        pause
        exit /b 1
    )
    set PY=py
) else (
    set PY=python
)

%PY% -c "import uvicorn, fastapi, sqlalchemy" 2>nul
if errorlevel 1 (
    echo A instalar dependencias...
    %PY% -m pip install uvicorn fastapi sqlalchemy python-jose bcrypt python-multipart aiofiles httpx
)

%PY% seed.py 2>nul

echo.
echo ============================================
echo   Na Tua Presenca - 365 dias com Deus
echo   Servidor: http://localhost:9011
echo   Abre no teu browser
echo   Para parar: CTRL+C
echo ============================================
echo.

%PY% -m uvicorn app.main:app --host 0.0.0.0 --port 9011
if errorlevel 1 (
    echo.
    echo ERRO: Nao foi possivel iniciar o servidor.
    echo Verifica se a porta 9011 ja nao esta em uso.
    pause
)
