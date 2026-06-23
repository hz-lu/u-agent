@echo off
setlocal
cd /d "%~dp0\.."
npm.cmd run stage:windows-portable:slim
exit /b %ERRORLEVEL%
