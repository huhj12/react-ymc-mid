@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ============================
echo   용인중앙교회 앱 시작 중...
echo ============================

:: 백엔드 서버 시작 (최소화)
start /min "YMC 백엔드" cmd /k "cd /d "%~dp0server" && node server.js"

:: React 앱 시작 (백그라운드, 브라우저 자동오픈 비활성화)
start /min "YMC React" cmd /k "cd /d "%~dp0" && set BROWSER=none && npm start"

:: 서버가 준비될 때까지 기다렸다가 브라우저 오픈 (최대 60초)
echo 브라우저 준비 중... 잠시만 기다려 주세요.
powershell -NoProfile -Command "$maxRetry=60; for($i=0;$i -lt $maxRetry;$i++){ try{ (New-Object Net.WebClient).DownloadString('http://localhost:3000') | Out-Null; Start-Process 'http://localhost:3000'; break } catch { Start-Sleep 1 } }"

exit
