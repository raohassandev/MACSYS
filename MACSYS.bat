

@echo off
cd /d "%~dp0"

:: Start Backend (Node.js)
start cmd /k "cd macsys_engine && npm install && npm run dev"

:: Start Frontend (React)
start cmd /k "cd macsys_web && npm install && npm run dev"

