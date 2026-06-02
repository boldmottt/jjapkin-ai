#!/usr/bin/env bash
# JJapkin AI 원클릭 실행기 (macOS / Linux)
# 더블클릭하면 서버가 켜지고 브라우저가 자동으로 열립니다.
# (Linux에서 더블클릭이 편집기로 열리면: 우클릭 → "실행" 또는 터미널에서 ./start.command)

set -e
cd "$(dirname "$0")"

echo "🚀 JJapkin AI 시작 중..."

# 1) Node.js 확인
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js가 설치되어 있지 않습니다. https://nodejs.org 에서 설치 후 다시 실행하세요."
  read -r -n 1 -p "엔터를 누르면 종료합니다..."
  exit 1
fi

# 2) 의존성 설치 (최초 1회)
if [ ! -d node_modules ]; then
  echo "📦 의존성 설치 중... (최초 1회, 수 분 소요)"
  npm install
fi

# 3) 환경변수 파일 준비
if [ ! -f .env.local ] && [ -f .env.template ]; then
  cp .env.template .env.local
  echo "📝 .env.local 을 생성했습니다. AI 생성 기능을 쓰려면 DEEPSEEK_API_KEY 를 채워주세요."
fi

# 4) 서버 준비되면 브라우저 자동 오픈
URL="http://localhost:3000"
(
  for _ in $(seq 1 60); do
    if curl -s -o /dev/null "$URL" 2>/dev/null; then break; fi
    sleep 1
  done
  if command -v open >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  fi
) &

# 5) 개발 서버 실행 (이 창을 닫으면 서버가 종료됩니다)
echo "🌐 브라우저가 곧 $URL 로 열립니다. 이 창을 닫으면 서버가 종료됩니다."
npm run dev
