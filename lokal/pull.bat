@echo off
setlocal
title Git Pull - alfun3
cd /d "%~dp0.."

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Folder ini bukan repository Git.
    pause
    exit /b 1
)

echo.
echo === PULL alfun3 ===
git pull --ff-only origin main
if errorlevel 1 (
    echo.
    echo [ERROR] Pull gagal. Periksa perubahan lokal atau koneksi.
    pause
    exit /b 1
)

echo.
echo [OK] Repository berhasil diperbarui.
pause
exit /b 0
