@echo off
setlocal
cd /d "%~dp0\.."
if not exist release mkdir release
set LOG_FILE=release\windows-stage-slim.log

echo OpenClawPro Agent Hub - Windows slim staging
echo Project: %CD%
echo Log: %CD%\%LOG_FILE%
echo.

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm.cmd was not found. Please install Node.js first.
  echo ERROR: npm.cmd was not found. Please install Node.js first. > "%LOG_FILE%"
  pause
  exit /b 1
)

echo Running: npm.cmd run stage:windows-portable:slim
echo Running: npm.cmd run stage:windows-portable:slim > "%LOG_FILE%"
call npm.cmd run stage:windows-portable:slim >> "%LOG_FILE%" 2>&1
set EXIT_CODE=%ERRORLEVEL%

echo.
type "%LOG_FILE%"
echo.
if "%EXIT_CODE%"=="0" (
  echo DONE: staging generated at release\windows-shell-e2e-slim-staging
) else (
  echo FAILED: command exited with code %EXIT_CODE%
)
echo Full log: %CD%\%LOG_FILE%
echo.
pause
exit /b %EXIT_CODE%
