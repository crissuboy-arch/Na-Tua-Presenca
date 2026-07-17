@echo off
echo Stopping Na Tua Presenca...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /v ^| findstr "uvicorn"') do taskkill /pid %%a /f 2>nul
echo Done.
pause
