# 🚀 JJapkin AI

> 텍스트를 붙여넣으면 AI가 자동으로 다이어그램, 플로우차트, 인포그래픽으로 변환해주는 비즈니스 시각화 도구

**13종 다이어그램**(플로우차트·마인드맵·프로세스·비교표·리스트·타임라인·카드그리드·
2x2매트릭스·피라미드·퍼널·벤다이어그램·막대차트·스윔레인) · **AI 아이콘 자동 매핑** ·
**테마 프리셋 5종** · **엣지 라벨/강조** · **커맨드 팔레트(⌘K)** · **문단별 생성** ·
**벡터 PDF(한글 임베딩)**

## 기술 스택

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui
- **Editor:** Excalidraw (@excalidraw/excalidraw)
- **State:** Zustand + React Query
- **AI:** DeepSeek (deepseek-chat) → OpenAI GPT-4o-mini → Anthropic Claude fallback
- **DB:** PostgreSQL + Prisma (Supabase)
- **Auth:** Supabase Auth (이메일 매직링크, 선택 — 미설정 시 익명 모드)
- **Deploy:** Vercel

## 시작하기

### 🖱️ 원클릭 실행 (가장 쉬움)

- **Windows:** `start.bat` 더블클릭
- **macOS:** `start.command` 더블클릭 (최초엔 우클릭 → "열기")
- **Linux:** 터미널에서 `./start.command` 실행

자동으로 의존성을 설치하고 서버를 켠 뒤 브라우저(`http://localhost:3000`)를 엽니다.
(Node.js 18+ 필요. AI 생성 기능은 `.env.local`에 `DEEPSEEK_API_KEY` 설정 시 동작)

> **로컬 모드**: 로그인이나 DB(Supabase) 없이도 바로 사용할 수 있습니다.
> 작성한 텍스트와 편집한 다이어그램은 브라우저(localStorage)에 자동 저장되어
> 새로고침/재방문에도 유지됩니다. 로그인/DB를 설정하면 서버와 동기화됩니다.

### 수동 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.template .env.local
# → .env.local 파일을 편집하여 DEEPSEEK_API_KEY 추가 (OPENAI_API_KEY·ANTHROPIC_API_KEY는 폴백용 옵션)

# 3. DB 초기화 (선택)
npx prisma db push

# 4. 개발 서버 시작
npm run dev
# → http://localhost:3000
```

## 스크립트

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run test         # 테스트 실행
npm run test:watch   # 테스트 워치 모드
npm run lint         # 린트 검사
npm run format       # 코드 포맷팅
npm run typecheck    # 타입 체크
npm run db:studio    # Prisma Studio (DB GUI)
```

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/page.tsx     # 메인 편집기 페이지
│   ├── api/generate/       # 다이어그램 생성 API
│   └── layout.tsx          # 루트 레이아웃
├── features/               # 도메인 모듈
│   ├── text-editor/        # 텍스트 입력
│   ├── canvas-editor/      # Excalidraw 편집기
│   ├── diagram-generator/  # AI 생성 + 후보 패널
│   ├── ai-pipeline/        # AI 연동 로직
│   └── export-pipeline/    # 내보내기
├── stores/                 # Zustand 상태 관리
├── lib/                    # 공통 라이브러리
│   ├── ai/                 # AI 클라이언트(DeepSeek/OpenAI/Claude), Prompt, Parser, Cache
│   ├── db/                 # Prisma 클라이언트
│   └── utils/              # cn() 유틸리티
└── types/                  # 타입 정의
```

## 🧩 구현 상태

| 스프린트 | 기능 | 상태 |
|:---:|------|:---:|
| 1 | AI 파이프라인 (DeepSeek/OpenAI/Claude, 프롬프트, 파서, 캐싱) | ✅ |
| 2 | Excalidraw 연동 (IR→Elements, 5종 레이아웃, 편집기) | ✅ |
| 3 | 다이어그램 유형 선택기 + 편집 기능 | ✅ |
| 4 | 내보내기 (PNG/SVG/PPT/PDF) | ✅ |
| - | 배포 (Vercel) | ✅ |

## API

### POST /api/generate

```json
// Request
{ "text": "고객이 주문하면 시스템이 재고를 확인합니다..." }

// Response
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": "c1",
        "ir": {
          "diagramType": "flowchart",
          "title": "Order Processing Flow",
          "nodes": [...],
          "edges": [...]
        }
      }
    ],
    "recommendedType": "flowchart",
    "tokensUsed": 150,
    "fromCache": false
  }
}
```

## 라이선스

MIT
