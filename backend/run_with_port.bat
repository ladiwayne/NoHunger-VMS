@echo off
SETLOCAL ENABLEDELAYEDEXPANSION
set PORT=5001
cd /d "%~dp0"
echo Starting backend with PORT=%PORT%
npm start
ENDLOCAL
