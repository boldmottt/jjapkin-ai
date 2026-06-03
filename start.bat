@echo off
chcp 65001 >nul
REM JJapkin AI 원클릭 실행기 (Windows)
REM 더블클릭하면 서버가 켜지고 브라우저가 자동으로 열립니다.
cd /d "%~dp0"
title JJapkin AI

echo 🚀 JJapkin AI 시작 중...

REM 1) Node.js 확인
where node >nul 2>nul
if errorlevel 1 (
  echo ❌ Node.js가 설치되어 있지 않습니다. https://nodejs.org 에서 설치 후 다시 실행하세요.
  pause
  exit /b 1
)

REM 2) 의존성 설치 (최초 1회)
if not exist node_modules (
  echo 📦 의존성 설치 중... ^(최초 1회, 수 분 소요^)
  call npm install
)

REM 3) 환경변수 파일 준비
if not exist .env.local if exist .env.template (
  copy .env.template .env.local >nul
  echo 📝 .env.local 을 생성했습니다. AI 생성 기능을 쓰려면 DEEPSEEK_API_KEY 를 채워주세요.
)

REM 4) 잠시 후 브라우저 자동 오픈 (서버 기동 대기)
echo 🌐 잠시 후 브라우저가 http://localhost:3000 으로 열립니다. 이 창을 닫으면 서버가 종료됩니다.
start "" cmd /c "timeout /t 6 >nul & start "" http://localhost:3000"

REM 5) 개발 서버 실행
call npm run dev
pause
