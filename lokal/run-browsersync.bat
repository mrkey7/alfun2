@echo off
setlocal
set "_port=3000"
set "_ip="

:: Ambil IPv4 Wi-Fi untuk akses dari perangkat lain.
for /f "tokens=2 delims=:" %%A in ('netsh interface ip show config name^="Wi-Fi" ^| findstr /i "IP Address"') do (
    for /f "tokens=* delims= " %%B in ("%%A") do set "_ip=%%B"
)

:: BrowserSync dijalankan dari root test-alfun2.
pushd "%~dp0.."

if defined _ip (
    start "Alfiyyah BrowserSync" cmd /k npx --yes browser-sync start --server . --host %_ip% --port %_port% --files "index.html,app/**/*" --no-open --no-notify --no-ui --no-ghost-mode
) else (
    start "Alfiyyah BrowserSync" cmd /k npx --yes browser-sync start --server . --host localhost --port %_port% --files "index.html,app/**/*" --no-open --no-notify --no-ui --no-ghost-mode
)

timeout /t 2 /nobreak >nul
start "" chrome "http://localhost:%_port%"

if defined _ip (
    echo.
    echo Akses dari perangkat lain:
    echo http://%_ip%:%_port%
)

popd
endlocal
