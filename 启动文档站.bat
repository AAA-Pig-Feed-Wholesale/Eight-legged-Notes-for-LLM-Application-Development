@echo off
setlocal
cd /d "%~dp0"
title Live Markdown Docs

set "PY_CMD="
where python >nul 2>nul
if not errorlevel 1 set "PY_CMD=python"

if not defined PY_CMD (
  where py >nul 2>nul
  if not errorlevel 1 set "PY_CMD=py -3"
)

if not defined PY_CMD (
  echo Python 3 was not found.
  echo Please install Python 3 and make sure "python" or "py" works in cmd.
  echo.
  pause
  exit /b 1
)

echo Starting live docs site...
echo.
echo Stopping old docs site processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'python.exe' -and $_.CommandLine -like '*docs_site.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul
timeout /t 1 /nobreak >nul

echo Launching new docs site...
echo.
call %PY_CMD% docs_site.py
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  echo Docs site exited with code %EXIT_CODE%.
  echo If there is an error above, send it to me.
) else (
  echo Docs site stopped.
)
echo.
pause
