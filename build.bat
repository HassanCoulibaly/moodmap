@echo off
title MoodMap Build
cd /d %~dp0

echo.
echo  Building MoodMap for production...
echo.

call npm run build

if %errorlevel% neq 0 (
  echo.
  echo  BUILD FAILED
  pause
  exit /b 1
)

echo.
echo  Build complete. Output in dist/
echo.
pause
