@echo off
setlocal
title Git Push - alfun3
cd /d "%~dp0.."

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Folder ini bukan repository Git.
    pause
    exit /b 1
)

echo.
echo === PUSH alfun3 ===

git status --porcelain | findstr /r "." >nul
if errorlevel 1 (
    echo.
    echo Tidak ada perubahan. Push dibatalkan.
    pause
    exit /b 0
)

echo.
git status --short
echo.

set /p "MSG=Pesan commit: "
if not defined MSG (
    echo [ERROR] Pesan commit tidak boleh kosong.
    pause
    exit /b 1
)

git add -A
if errorlevel 1 goto :gagal

git diff --cached --quiet
if not errorlevel 1 (
    echo.
    echo Tidak ada perubahan untuk di-commit.
    pause
    exit /b 0
)

git commit -m "%MSG%"
if errorlevel 1 goto :gagal

git push origin main
if errorlevel 1 goto :gagal

echo.
echo [OK] Perubahan berhasil dikirim ke origin/main.
pause
exit /b 0

:gagal
echo.
echo [ERROR] Proses push gagal. Periksa pesan Git di atas.
pause
exit /b 1
