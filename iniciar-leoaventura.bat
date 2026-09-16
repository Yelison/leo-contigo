@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas instalar Node.js desde https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Preparando Leoaventura por primera vez...
  call npm install
  if errorlevel 1 (
    echo No se pudo instalar Leoaventura.
    pause
    exit /b 1
  )
)
echo Abriendo Leoaventura...
call npm start
pause
