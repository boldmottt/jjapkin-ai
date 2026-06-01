# JJapkin AI - Product Requirements Document (PRD)

> **버전:** v1.0  
> **작성일:** 2026-06-01  
> **상태:** MVP 설계  
> **독자:** 개발자, 디자이너, PM

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [문제 정의 & 타겟 사용자](#2-문제-정의--타겟-사용자)
3. [경쟁사 분석](#3-경쟁사-분석)
4. [핵심 기능 (MVP)](#4-핵심-기능-mvp)
5. [사용자 플로우](#5-사용자-플로우)
6. [기술 스택](#6-기술-스택)
7. [데이터 모델](#7-데이터-모델)
8. [AI 파이프라인 설계](#8-ai-파이프라인-설계)
9. [렌더링 & 편집기 명세](#9-렌더링--편집기-명세)
10. [내보내기 파이프라인](#10-내보내기-파이프라인)
11. [UI/UX 명세](#11-uiux-명세)
12. [개발 로드맵](#12-개발-로드맵)
13. [인프라 & 배포](#13-인프라--배포)
14. [성공 지표](#14-성공-지표)
15. [위험 요소 & 완화 전략](#15-위험-요소--완화-전략)

---

## 1. 제품 개요

### 1.1 제품명 (가칭)
**JJapkin AI** (또는 "DiagramGPT", "Text2Viz")

### 1.2 한 줄 설명
> 텍스트를 붙여넣으면 AI가 자동으로 다이어그램, 플로우차트, 인포그래픽으로 변환해주는 비즈니스 시각화 도구

### 1.3 제품 비전
"생각을 텍스트로 쓰면, AI가 그림으로 보여준다"

JJapkin AI는 **프롬프트 엔지니어링 없이**, 기존에 작성한 텍스트(보고서, 블로그 글, 회의록, 브리핑)만으로 전문적인 비즈니스 다이어그램을 생성합니다. 생성된 시각 자료는 벡터 기반 편집기를 통해 자유롭게 커스터마이징할 수 있으며, PNG/SVG/PPT/PDF로 내보낼 수 있습니다.

### 1.4 왜 만드는가?

| 관점 | 이유 |
|------|------|
| **사용자** | PPT/문서에 쓸 다이어그램 그리는 데 평균 15~45분 소요. AI로 30초로 단축 |
| **시장** | napkin 같은 도구가 $0→$22/월 유료 모델로 검증됨. 시장 수요 존재 |
| **기술** | GPT-4o/Claude 수준의 LLM이면 텍스트→구조 파싱 충분히 가능. Excalidraw 등 오픈소스 그래픽 라이브러리 성숙 |

---

## 2. 문제 정의 & 타겟 사용자

### 2.1 현재 페인 포인트

```
"나는 생각을 글로 쓰는 건 빠른데, 
 그림으로 만드는 건 너무 오래 걸린다"
```

| 문제 | 현재 해결책 | 불편함 |
|------|-----------|--------|
| 보고서에 다이어그램 넣기 | 파워포인트 도형 수작업 | 시간 소모, 디자인 퀄리티 낮음 |
| 블로그 글 시각화 | Canva/미리캔버스에서 따로 작업 | 컨텍스트 스위칭, 별도 툴 학습 필요 |
| 회의록 구조화 | 화이트보드에 그림 → 다시 디지털화 | 이중 작업 |
| 빠른 컨셉 시각화 | 연필로 낙서 → 공유 불가 | 팀 협업 어려움 |

### 2.2 타겟 페르소나

| 페르소나 | 니즈 | 사용량 |
|---------|------|:------:|
| **비즈니스 플래너** (PM, 기획자) | 전략 맵, 로드맵, 프로세스 차트 | 주 3~5회 |
| **마케터/블로거** | 블로그 인포그래픽, 소셜미디어 카드 | 주 2~3회 |
| **컨설턴트** | 클라이언트 제안서 다이어그램 | 주 5~10회 |
| **교육자** | 수업 자료 시각화 | 주 3~5회 |
| **개발자** (문서화) | 아키텍처 다이어그램, ERD, 시퀀스 다이어그램 | 주 1~2회 |

### 2.3 사용자 여정 (AS-IS → TO-BE)

```
[AS-IS]
텍스트 초안 작성 → "이걸 그림으로 어떻게 표현하지?" 
→ 파워포인트 열기 → 도형 삽입 → 정렬 → 색상 → 저장 → 복붙
⏱️ 소요 시간: 15~45분

[TO-BE]
텍스트 붙여넣기 → "Generate" 클릭 → 다이어그램 3개 제안 
→ 하나 선택 → 색상/아이콘 약간 수정 → PPT로 내보내기
⏱️ 소요 시간: 30초~2분
```

---

## 3. 경쟁사 분석

### 3.1 직접 경쟁

| 제품 | 가격 | 강점 | 약점 |
|------|------|------|------|
| **napkin AI** | Free ~ $22/월 | 벡터 편집기 최고, 브랜드 스튜디오 | 인터페이스 영어 전용 |
| **Gamma** | Free ~ $20/월 | AI PPT 생성 올인원 | 다이어그램 종류 제한적 |
| **Beautiful.ai** | $12~$40/월 | 템플릿 품질 높음 | 자유도 낮음, 편집 불편 |

### 3.2 간접 경쟁

| 제품 | 관련성 | 비고 |
|------|:------:|------|
| **Mermaid.live** | 직접 연결 | 텍스트→다이어그램만, 편집기 없음 |
| **Excalidraw** | 오픈소스 베이스 | 자유도 높지만 AI 없음, 수작업 |
| **draw.io (diagrams.net)** | 편집기 참고 | 기능 풍부하지만 AI 없음 |
| **Canva** | 시각화 범용 | AI 기능 시작했지만 다이어그램 특화 아님 |

### 3.3 우리의 차별점

| 차별 포인트 | JJapkin | 우리 |
|-----------|:------:|:----:|
| **한국어 최적화** | 지원은 되지만 부자연스러움 | 한국어 문서·비즈니스 용어에 특화 |
| **PPT 내보내기 퀄리티** | 기본 수준 | 편집 가능한 개별 도형으로 분해 |
| **코드 다이어그램** (개발자용) | 없음 | Mermaid + 시퀀스 다이어그램 지원 |
| **오픈소스 기반** | 폐쇄형 | Excalidraw 기반 커스터마이징, 확장 가능 |
| **로컬 LLM 지원** | 클라우드 전용 | Ollama/LM Studio 연동 옵션 |

---

## 4. 핵심 기능 (MVP)

### 4.1 MVP 범위 (Phase 1 — 4주)

```
MVP = 텍스트 입력 → AI 분석 → 다이어그램 생성 → 편집 → 내보내기
```

| ID | 기능 | 우선순위 | 설명 |
|----|------|:------:|------|
| **F1** | 텍스트 에디터 | P0 | 마크다운 지원, 드래그 드롭 파일 임포트 (.md, .txt) |
| **F2** | AI 다이어그램 생성 | P0 | 텍스트 청크 선택 → "Generate" → 3가지 스타일 제안 |
| **F3** | 벡터 편집기 | P0 | Excalidraw 기반: 이동/리사이즈/색상/텍스트 수정 |
| **F4** | 다이어그램 유형 5종 | P0 | 플로우차트, 마인드맵, 리스트, 프로세스, 비교표 |
| **F5** | PNG 내보내기 | P0 | 배경 투명 지원 |
| **F6** | SVG 내보내기 | P0 | 편집 가능한 벡터 |
| **F7** | PPT 내보내기 | P1 | 개별 도형으로 분해 (pptxgenjs) |
| **F8** | PDF 내보내기 | P1 | 전체 문서 내보내기 |
| **F9** | 아이콘 라이브러리 | P1 | Lucide Icons 기본 내장, 아이콘 교체 UI |
| **F10** | 컬러 테마 | P1 | 10개 기본 테마 + 커스텀 컬러픽커 |

### 4.2 Phase 2 (MVP 이후 — +6주)

| ID | 기능 | 설명 |
|----|------|------|
| **F11** | 사용자 계정 (Google OAuth) | Firebase Auth |
| **F12** | 문서 저장 & 히스토리 | 자동 저장, 버전 관리 |
| **F13** | PPT 고품질 내보내기 | Office Open XML 직접 생성 |
| **F14** | 브랜드 스튜디오 | 로고/컬러/폰트 저장, 일괄 적용 |
| **F15** | PDF/PPT 파일 → 텍스트 추출 | 업로드한 파일에서 바로 시각화 |
| **F16** | 소셜 공유 | 링크 공유, 임베드 코드 |

### 4.3 Phase 3 (장기 — +3개월)

| ID | 기능 | 설명 |
|----|------|------|
| **F17** | 다이어그램 유형 15+가지 | 간트차트, 조직도, ERD, 타임라인 등 |
| **F18** | 실시간 협업 | WebSocket + CRDT |
| **F19** | 크레딧 시스템 + 결제 (Stripe) | Free/Pro/Team 플랜 |
| **F20** | 커스텀 AI 모델 파인튜닝 | 다이어그램 생성 특화 모델 |
| **F21** | API (B2B) | SaaS API 형태로 타사 제품에 임베딩 |

---

## 5. 사용자 플로우

### 5.1 메인 플로우 (Happy Path)

```
[랜딩 페이지] → [새 문서] → [텍스트 입력/붙여넣기]
                                    ↓
                            [텍스트 범위 선택]
                                    ↓
                            [Generate 버튼 클릭]
                                    ↓
                    ┌─────── AI 분석 ───────┐
                    ↓                        ↓
            [주제/핵심 관계 추출]    [다이어그램 유형 추천]
                    └────────┬───────────────┘
                             ↓
                    [3개 다이어그램 후보 생성]
                             ↓
                    [사용자가 하나 선택]
                             ↓
                    [벡터 편집기에서 수정]
                             ↓
                    [PNG/SVG/PPT/PDF 내보내기]
```

### 5.2 에러 플로우

| 상황 | 처리 |
|------|------|
| AI가 적절한 다이어그램을 못 찾음 | "다이어그램 유형을 직접 선택해주세요" → 수동 선택 UI |
| 텍스트가 너무 짧음 (1문장) | "더 많은 컨텍스트가 필요합니다" + 최소 50자 요구 |
| 텍스트가 너무 김 (5000자+) | 자동 청크 분할, "시각화할 부분을 선택해주세요" |
| API 호출 실패 | 재시도 버튼 + "잠시 후 다시 시도해주세요" |

---

## 6. 기술 스택

### 6.1 프론트엔드

| 기술 | 용도 | 선택 이유 |
|------|------|----------|
| **Next.js 14** (App Router) | 웹 프레임워크 | SSR + API Routes, Vercel 배포 최적화 |
| **TypeScript** | 언어 | 타입 안전성 |
| **Tailwind CSS** | 스타일링 | 빠른 UI 개발, 유틸리티 우선 |
| **shadcn/ui** | UI 컴포넌트 | 접근성, 커스터마이징 용이 |
| **Excalidraw** (core) | 벡터 편집기 | 오픈소스, React 연동, npm 패키지 `@excalidraw/excalidraw` |
| **Zustand** | 상태 관리 | 가벼움, 편집기 상태 관리에 적합 |
| **React Query** | 서버 상태 | API 응답 캐싱, 자동 리페치 |
| **Lucide Icons** | 아이콘 라이브러리 | 1000+ 아이콘, 경량 |

### 6.2 백엔드 & AI

| 기술 | 용도 | 선택 이유 |
|------|------|----------|
| **Next.js API Routes** | 백엔드 (초기) | 프론트엔드와 통합, 별도 서버 불필요 |
| **OpenAI API** (GPT-4o-mini) | 텍스트 분석 | 가장 정확한 구조 파싱, 비용 대비 성능 좋음 |
| **Anthropic Claude 3.5 Sonnet** | 대체 AI | 긴 컨텍스트 처리 우수 |
| **Mermaid.js** | 코드→다이어그램 렌더링 | 표준 문법, 광범위한 다이어그램 유형 |
| **LangChain** | AI 파이프라인 | 청크 분할, 프롬프트 체인 관리 |
| **Redis** | 캐싱 | 동일 텍스트에 대한 생성 결과 캐싱 |
| **Prisma** | ORM | 타입 안전, 마이그레이션 |
| **PostgreSQL** | 메인 DB | JSONB 지원 (다이어그램 데이터 저장) |

### 6.3 내보내기

| 기술 | 용도 |
|------|------|
| **html-to-image** | PNG Export |
| **pptxgenjs** | PPT Export (Phase 1) |
| **jsPDF** | PDF Export |
| **Excalidraw built-in SVG** | SVG Export |

### 6.4 인프라

| 기술 | 용도 |
|------|------|
| **Vercel** | 프론트엔드 호스팅 |
| **Supabase** | DB + Auth + Storage 대체 옵션 |
| **Cloudflare R2** | 생성된 이미지/파일 저장 |
| **Upstash Redis** | 서버리스 레디스 |
| **Sentry** | 에러 트래킹 |
| **Plausible** | 분석 (개인정보 수집 없는) |

---

## 7. 데이터 모델

### 7.1 ER 다이어그램 (텍스트)

```
User ──< Document ──< Chapter ──< Visual
  │                    │
  └── BrandStyle       └── RawText
```

### 7.2 핵심 테이블

#### User
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  provider      TEXT,  -- 'google', 'email'
  plan          TEXT DEFAULT 'free',  -- free | pro | team
  credits_used  INT DEFAULT 0,
  credits_limit INT DEFAULT 500,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

#### Document
```sql
CREATE TABLE documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  title      TEXT DEFAULT 'Untitled',
  raw_text   TEXT,
  is_public  BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Visual
```sql
-- 하나의 다이어그램/시각 요소
CREATE TABLE visuals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
  source_text     TEXT NOT NULL,         -- 원본 텍스트 (어디서 생성됐는지)
  diagram_type    TEXT NOT NULL,         -- 'flowchart' | 'mindmap' | 'process' | 'comparison' | 'list'
  excalidraw_data JSONB NOT NULL,        -- Excalidraw 포맷 데이터
  thumbnail_url   TEXT,                  -- 썸네일 이미지
  state_checksum  TEXT,                  -- 변경 감지용
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### BrandStyle
```sql
CREATE TABLE brand_styles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  name          TEXT NOT NULL,
  primary_color TEXT,    -- '#3B82F6'
  accent_color  TEXT,
  font_family   TEXT,
  logo_url      TEXT,
  is_default    BOOLEAN DEFAULT false
);
```

#### GenerationCache
```sql
-- 동일 텍스트에 대한 중복 생성 방지
CREATE TABLE generation_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_hash     TEXT UNIQUE NOT NULL,    -- SHA256 of source_text
  diagram_type  TEXT NOT NULL,
  result_json   JSONB NOT NULL,          -- 생성된 다이어그램 후보들
  model_used    TEXT,                    -- 'gpt-4o-mini' | 'claude-3-sonnet'
  tokens_used   INT,
  cached_at     TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ              -- TTL: 7일
);
```

---

## 8. AI 파이프라인 설계

### 8.1 전체 파이프라인

```
사용자 텍스트
     │
     ▼
[1] 텍스트 전처리
     ├─ 마크다운 파싱 (제목/본문/리스트 구조 추출)
     ├─ 청크 분할 (500~2000자 단위)
     └─ 언어 감지
     │
     ▼
[2] LLM 구조 분석 (GPT-4o-mini)
     ├─ 핵심 개념 추출
     ├─ 개념 간 관계 파악 (순서 / 계층 / 비교 / 인과)
     └─ 최적 다이어그램 유형 추천
     │
     ▼
[3] 중간 표현 생성 (JSON Schema)
     ├─ 다이어그램 유형: flowchart | mindmap | process | comparison | list
     ├─ 노드 정의: {id, label, type, parent?}
     ├─ 엣지 정의: {from, to, label?}
     └─ 메타데이터: {title, description, suggestedColors}
     │
     ▼
[4] Mermaid 변환 (선택적)
     ├─ JSON → Mermaid 문법
     └─ Mermaid → SVG 렌더링 (preview용)
     │
     ▼
[5] Excalidraw 변환
     ├─ JSON → Excalidraw Elements
     ├─ 레이아웃 계산 (자동 배치 알고리즘)
     └─ 초기 스타일 적용 (테마 컬러)
     │
     ▼
[6] 편집기에 로딩
     └─ 사용자가 선택한 후보를 Excalidraw 캔버스에 렌더링
```

### 8.2 프롬프트 템플릿

#### 시스템 프롬프트

```
You are a diagram generation expert. Your job is to convert text into 
structured visual diagrams.

Given text, you must:
1. Identify the main topic and key concepts
2. Determine the relationship between concepts:
   - sequential → flowchart
   - hierarchical → mindmap / tree
   - comparative → comparison table / venn
   - causal → process diagram / cycle
3. Output a valid JSON structure that describes nodes and edges.

Rules:
- Max 10 nodes per diagram (for readability)
- Each node label must be under 15 words
- Choose the single best diagram type (not multiple)
- Always provide a descriptive title

Output format (strict JSON):
{
  "diagramType": "flowchart",
  "title": "...",
  "description": "...",
  "nodes": [
    {"id": "n1", "label": "...", "type": "process", "color":"#3B82F6"},
    ...
  ],
  "edges": [
    {"from": "n1", "to": "n2", "label": "..."},
    ...
  ]
}
```

#### Few-shot 예시

```
Input: "First, the customer places an order. Then the system checks 
inventory. If in stock, payment is processed and order is confirmed. 
If out of stock, the customer is notified."

Output:
{
  "diagramType": "flowchart",
  "title": "Order Processing Flow",
  "nodes": [
    {"id": "n1", "label": "Customer Places Order", "type": "start"},
    {"id": "n2", "label": "Check Inventory", "type": "decision"},
    {"id": "n3", "label": "Process Payment", "type": "process"},
    {"id": "n4", "label": "Confirm Order", "type": "end"},
    {"id": "n5", "label": "Notify Customer", "type": "end"}
  ],
  "edges": [
    {"from": "n1", "to": "n2"},
    {"from": "n2", "to": "n3", "label": "In Stock"},
    {"from": "n3", "to": "n4"},
    {"from": "n2", "to": "n5", "label": "Out of Stock"}
  ]
}
```

### 8.3 API 비용 추정

| 모델 | input (1K tokens) | output (1K tokens) | 평균 생성당 |
|------|:---:|:---:|:---:|
| GPT-4o-mini | $0.00015 | $0.0006 | $0.001~0.003 |
| Claude 3.5 Sonnet | $0.003 | $0.015 | $0.01~0.03 |
| GPT-4o (고품질) | $0.0025 | $0.01 | $0.005~0.02 |

**월간 추정 (사용자 1,000명, 평균 20회 생성/월):**
- GPT-4o-mini: $40~120/월
- GPT-4o: $200~800/월

---

## 9. 렌더링 & 편집기 명세

### 9.1 Excalidraw 기반 편집기

Excalidraw는 아래 기능을 기본 제공합니다:

| 기능 | 제공 여부 | 추가 작업 |
|------|:---:|------|
| 드래그로 이동 | ✅ | 없음 |
| 리사이즈 (핸들) | ✅ | 없음 |
| 텍스트 편집 (더블클릭) | ✅ | 없음 |
| 컬러 변경 | ✅ | 테마 사전 정의 추가 |
| 연결선 (Arrow) | ✅ | 스마트 라우팅 개선 |
| 그룹핑 | ✅ | 없음 |
| Undo/Redo | ✅ | 없음 |
| SVG Export | ✅ | 없음 |
| PNG Export | ✅ | 배경 투명 옵션 |
| 아이콘 라이브러리 | ⚠️ | Lucide 아이콘을 Excalidraw 요소로 변환하는 어댑터 필요 |
| PPT Export | ❌ | 직접 구현 필요 |
| 레이어 | ❌ | 직접 구현 필요 |

### 9.2 커스텀 확장 기능

```typescript
// Excalidraw 플러그인 시스템 활용
interface JJapkinPlugin {
  // 아이콘 라이브러리
  iconLibrary: {
    search(query: string): Icon[];
    insert(icon: Icon, position: {x: number, y: number}): void;
  };
  
  // 테마 시스템
  themeEngine: {
    applyTheme(themeId: string, elements: ExcalidrawElement[]): ExcalidrawElement[];
    createCustomTheme(colors: ColorPalette): Theme;
  };
  
  // 레이아웃 엔진
  layoutEngine: {
    autoArrange(elements: ExcalidrawElement[], type: DiagramType): ExcalidrawElement[];
    snapToGrid(element: ExcalidrawElement): ExcalidrawElement;
  };
}
```

### 9.3 자동 레이아웃 알고리즘

```
Flowchart: top-to-bottom, 중심 정렬
  n1
   ↓
  n2
 / \
n3 n4

Mindmap: root 중심, radial 배치
    ├── child1
root┼── child2
    └── child3

Comparison: left-right 매트릭스
[A 항목] | [B 항목]
---------|---------
  ...    |   ...

Process: left-to-right, 단계별
[Step1] → [Step2] → [Step3] → [Step4]
```

---

## 10. 내보내기 파이프라인

### 10.1 PNG Export

```typescript
// Excalidraw의 exportToBlob API 사용
import { exportToBlob } from '@excalidraw/excalidraw';

async function exportPNG(elements: ExcalidrawElement[], opts: {
  background: boolean;  // true = 흰색 배경, false = 투명
  scale: number;        // 기본 2x 레티나
}): Promise<Blob> {
  return exportToBlob({
    elements,
    appState: { exportBackground: opts.background },
    files: null,
    getDimensions: () => ({ width: 1920, height: 1080 }),
    mimeType: 'image/png',
  });
}
```

### 10.2 PPT Export (Phase 1: pptxgenjs)

```typescript
import PptxGenJS from 'pptxgenjs';

async function exportPPTX(elements: ExcalidrawElement[]): Promise<Blob> {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  
  // 각 Excalidraw 요소를 PPT 도형으로 변환
  for (const el of elements) {
    switch (el.type) {
      case 'rectangle':
        slide.addShape(pptx.ShapeType.rect, {
          x: el.x / 100,   // px → inches 변환
          y: el.y / 100,
          w: el.width / 100,
          h: el.height / 100,
          fill: { color: el.backgroundColor },
        });
        break;
      case 'text':
        slide.addText(el.text, {
          x: el.x / 100,
          y: el.y / 100,
          w: el.width / 100,
          h: el.height / 100,
          fontSize: el.fontSize,
          color: el.strokeColor,
        });
        break;
      case 'arrow':
        slide.addShape(pptx.ShapeType.line, {
          x: el.x / 100,
          y: el.y / 100,
          w: el.width / 100,
          h: el.height / 100,
          line: { color: el.strokeColor, width: el.strokeWidth },
        });
        break;
      // ... 기타 요소
    }
  }
  
  return pptx.write({ outputType: 'blob' });
}
```

### 10.3 SVG Export

```typescript
// Excalidraw 내장 API
import { exportToSvg } from '@excalidraw/excalidraw';

async function exportSVG(elements: ExcalidrawElement[]): Promise<SVGSVGElement> {
  return exportToSvg({
    elements,
    appState: { exportBackground: false },
    files: null,
  });
}
```

---

## 11. UI/UX 명세

### 11.1 레이아웃 구조

```
┌─────────────────────────────────────────────────┐
│  Logo    [New Doc] [Docs]  [👤 Profile]         │ ← Top Nav
├──────────────────┬──────────────────────────────┤
│                  │                              │
│   📝 TEXT        │     🎨 VISUAL CANVAS         │
│   EDITOR         │     (Excalidraw)             │
│   (좌측 40%)     │     (우측 60%)               │
│                  │                              │
│  제목: _______   │  ┌──────────────────────┐    │
│                  │  │                      │    │
│  본문:           │  │   [Flowchart]        │    │
│  첫 번째 단락... │  │   ┌──┐   ┌──┐       │    │
│                  │  │   │A │→→→│B │       │    │
│  두 번째 단락... │  │   └──┘   └──┘       │    │
│                  │  │        ↓             │    │
│  [Generate ✨]   │  │      ┌──┐            │    │
│                  │  │      │C │            │    │
│                  │  │      └──┘            │    │
│                  │  └──────────────────────┘    │
│                  │                              │
│                  │  [🔍 Zoom] [↩️ Undo] [📥 Export]│ ← Toolbar
├──────────────────┴──────────────────────────────┤
│  생성 후보: [후보1] [후보2] [후보3]              │ ← Bottom Panel
│  유형: [Flowchart] [Mindmap] [Process] [Custom] │
└─────────────────────────────────────────────────┘
```

### 11.2 키 컴포넌트 계층

```
<App>
  ├─ <TopNav>
  │   ├─ Logo
  │   ├─ DocumentTitle (editable)
  │   ├─ NavLinks (Docs | Templates)
  │   └─ UserMenu
  │
  ├─ <MainSplitPane>
  │   ├─ <TextEditorPanel>        // 좌측
  │   │   ├─ <EditorToolbar>      // Bold, Italic, Heading, etc.
  │   │   ├─ <TextArea>           // TipTap or Slate.js
  │   │   └─ <GenerateButton>     // ✨ Generate
  │   │
  │   └─ <CanvasPanel>             // 우측
  │       ├─ <CanvasToolbar>
  │       │   ├─ <UndoRedoButtons>
  │       │   ├─ <ZoomControls>
  │       │   ├─ <ThemePicker>
  │       │   └─ <ExportDropdown>  // PNG | SVG | PPT | PDF
  │       └─ <ExcalidrawCanvas>
  │           ├─ <ExcalidrawBoard>
  │           └─ <MiniMap>
  │
  ├─ <BottomPanel>
  │   ├─ <GenerationCandidates>    // AI가 생성한 후보들
  │   │   ├─ <CandidateCard /> x3
  │   │   └─ <DiagramTypeFilter>
  │   └─ <IconLibrary>             // 아이콘 팔레트
  │
  └─ <Toaster />                   // 알림
```

### 11.3 중요한 UX 디테일

1. **Generation 로딩 상태**: `✨ Generating your diagram...` + 스켈레톤 애니메이션 + 단계 표시 ("텍스트 분석 중..." → "레이아웃 계산 중...")
2. **후보 선택**: 3개 후보를 수평 카드 형태. 호버 시 확대, 클릭 시 캔버스에 로딩
3. **편집기 ↔ 텍스트 양방향 링크**: 편집기에서 노드 더블클릭 → 원본 텍스트의 해당 문장 하이라이트
4. **Undo/Redo**: 편집기 수정 사항만 Undo (텍스트 에디터는 별도)
5. **반응형**: 1024px 이하에서는 세로 스택 (텍스트 위, 편집기 아래)

---

## 12. 개발 로드맵

### Phase 1: MVP Core (4주)

| 주차 | 목표 | 주요 작업 |
|:---:|------|----------|
| **W1** | 프로젝트 셋업 | Next.js + TypeScript + Tailwind + shadcn/ui + Excalidraw |
| | 텍스트 에디터 | TipTap 마크다운 에디터 연동 |
| **W2** | AI 파이프라인 | OpenAI API 연동, 텍스트→JSON 변환, 5종 다이어그램 타입 |
| | Mermaid 렌더링 | JSON→Mermaid 변환기, 미리보기 |
| **W3** | Excalidraw 연동 | JSON→Excalidraw 요소 변환, 자동 레이아웃, 테마 시스템 |
| | 생성 후보 UI | 3개 후보 제안 카드, 선택/교체 UX |
| **W4** | 내보내기 | PNG/SVG (Excalidraw 내장), PDF (jsPDF) |
| | PPT 기본 | pptxgenjs 기본 도형 내보내기 |
| | 테스트 & 배포 | Vercel 배포, QA, 성능 최적화 |

### Phase 2: 프로덕트화 (6주)

| 주차 | 주요 작업 |
|:---:|----------|
| **W5-6** | Firebase Auth (Google OAuth), 사용자 대시보드 |
| **W7-8** | 문서 저장/불러오기, 자동 저장, 버전 히스토리 |
| **W9-10** | 브랜드 스튜디오, PPT 고품질 내보내기, 아이콘 라이브러리 |

### Phase 3: 스케일업 (12주+)

| 주차 | 주요 작업 |
|:---:|----------|
| **W11-14** | 15+ 다이어그램 유형, PDF/PPT 파일 임포트 |
| **W15-18** | 실시간 협업 (WebSocket + CRDT) |
| **W19-22** | 크레딧/결제 시스템, API (B2B), 커스텀 모델 파인튜닝 |

---

## 13. 인프라 & 배포

### 13.1 배포 아키텍처 (MVP)

```
                       ┌─────────────┐
                       │   Vercel    │
                       │  (Next.js)  │
                       └──────┬──────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌──────▼──────┐
        │   Supabase │  │   Redis    │  │  OpenAI API  │
        │  (Postgres)│  │  (Upstash) │  │  (GPT-4o-m)  │
        └───────────┘  └───────────┘  └─────────────┘
```

### 13.2 환경 변수

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://JJapkin-ai.vercel.app

# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=sk-ant-...

# Storage (R2)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...

# Auth
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Redis
UPSTASH_REDIS_URL=redis://...

# Monitoring
SENTRY_DSN=https://...
```

### 13.3 CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 14. 성공 지표

### 14.1 MVP 성공 기준

| 지표 | 목표 | 측정 방법 |
|------|:----:|----------|
| **생성 시간** | 텍스트→다이어그램 5초 이내 | API 응답 시간 로깅 |
| **생성 성공률** | 85% 이상 (적절한 다이어그램 생성) | 사용자 피드백 👍/👎 |
| **편집기 사용** | 평균 세션당 다이어그램 2개 이상 생성 | 이벤트 트래킹 |
| **내보내기** | 생성된 다이어그램의 30% 이상이 내보내기됨 | 이벤트 트래킹 |
| **재방문율** | 주간 활성 사용자 50%+ | DAU/WAU |

### 14.2 장기 성공 지표

| 지표 | 목표 |
|------|:----:|
| DAU (일간 활성 사용자) | 1,000+ |
| 유료 전환율 | Free→Pro 5% |
| 고객 획득 비용 (CAC) | $5 이하 |
| 월간 반복 수익 (MRR) | $10,000+ |
| 평균 응답 시간 (P95) | 3초 이내 |

---

## 15. 위험 요소 & 완화 전략

| 위험 | 영향 | 확률 | 완화 전략 |
|------|:----:|:----:|----------|
| **OpenAI API 장애** | 다이어그램 생성 불가 | 낮음 | Claude API 동시 연동, 로컬 LLM 폴백 |
| **API 비용 급증** | 수익성 악화 | 중간 | 캐싱 (동일 텍스트 재생성 방지), 크레딧 제한 |
| **경쟁사(Napkin) 업데이트** | 시장 점유율 위협 | 높음 | 차별화 (한국어 최적화, 코드 다이어그램)에 집중 |
| **Excalidraw 라이선스** | 상업적 제약 | 낮음 | MIT 라이선스 — 제약 없음 |
| **PPT 내보내기 품질 미달** | 사용자 불만 | 중간 | Phase 2에서 Office Open XML 직접 생성으로 개선 |
| **데이터 프라이버시** | 법적 이슈 | 낮음 | 텍스트 암호화 저장, AI 학습 옵트아웃 |

---

## 부록

### A. 레퍼런스

- [Napkin AI](https://www.napkin.ai/) — 직접 경쟁 제품
- [Excalidraw](https://excalidraw.com/) — 편집기 베이스
- [Mermaid.js](https://mermaid.js.org/) — 텍스트→다이어그램 표준
- [pptxgenjs](https://github.com/gitbrent/PptxGenJS) — PPT 생성
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling) — 구조화된 JSON 출력

### B. 용어 사전

| 용어 | 설명 |
|------|------|
| **Excalidraw Elements** | 벡터 그래픽 요소 (사각형, 텍스트, 화살표 등)의 배열 |
| **Diagram Type** | 다이어그램 유형 (flowchart, mindmap, process, comparison, list) |
| **Generation Candidate** | AI가 생성한 후보 다이어그램 (보통 3개 제안) |
| **Brand Studio** | 브랜드 컬러/폰트/로고를 저장하는 시스템 |
| **AI Credit** | 다이어그램 생성 1회당 소모되는 토큰 |
