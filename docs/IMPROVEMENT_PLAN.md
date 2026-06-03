# JJapkin AI — 초대형 개선 프로젝트 계획서

> 버전 1.0 · 작성일 2026-06-03 · 대상 브랜치 `claude/jjapkin-code-review-DCJFd`
> 목적: Napkin AI 벤치마크 분석을 기반으로, JJapkin AI를 "셀프호스팅 + 한글 네이티브 +
> 벡터 정밀 편집" 포지션의 경쟁력 있는 제품으로 끌어올리기 위한 6개 페이즈 로드맵.

---

## 0. 전략 개요

### 0.1 비전
> **"개발자·디자이너를 위한, 한글을 가장 잘 다루는 셀프호스팅 텍스트→비주얼 엔진."**

Napkin AI와 정면 승부(범용 SaaS·협업)가 아니라, Napkin이 **구조적으로 못 하는 영역**을
간판으로 세운다.

### 0.2 포지셔닝 (차별화 축)
| 축 | Napkin AI | JJapkin 목표 |
|---|---|---|
| 비용 모델 | 크레딧(단어당 과금), 워터마크 | BYO API 키, 무크레딧, 오픈 |
| 배포 | 클라우드 전용 | 셀프호스팅 + 로컬 모드 |
| 한글 | 가변적 품질 | **벡터 PDF 한글 임베딩 등 1급 지원** |
| 편집 깊이 | 더블클릭 수준 | **Illustrator급 벡터 편집(레이어/정렬/분배)** |
| 내보내기 | PPT/PNG/PDF/SVG | + **AI-SVG/AI-PDF/벡터 PDF** |

### 0.3 North Star Metric
**"입력 텍스트 → 만족스러운 비주얼까지의 시간(TTFV, Time-To-First-Visual)"**
보조 지표: 생성 후보 채택률, 재편집 없이 export하는 비율, 다이어그램 타입 커버리지.

---

## 1. 현재 상태 (As-Is)

### 1.1 기술 스택
Next.js 14(App Router) · TypeScript(strict) · Tailwind+shadcn/ui · Excalidraw ·
Zustand+React Query · DeepSeek→OpenAI→Claude 폴백 · Prisma+Supabase · Vercel.

### 1.2 구현된 기능
- AI 파이프라인: 3-폴백 체인, 프롬프트/파서/캐시, 사용량 로깅, 레이트리밋
- **5종 레이아웃**: flowchart·mindmap·process·comparison·list (`src/lib/ai/ir-to-excalidraw.ts`)
- 3-후보 생성 + 선택 패널
- Excalidraw 편집기 + **레이어 패널** + **Illustrator급 속성 패널**
- 내보내기: PNG·SVG·PPTX·PDF(이미지)·**벡터 PDF(한글 임베딩)**·AI-SVG·AI-PDF
- 로컬 모드(localStorage) + 선택적 Supabase Auth/DB 영속화
- 토스트·로딩·에러 UX, 원클릭 런처, 58개 테스트

### 1.3 핵심 자산(강점)
1. 벡터 PDF + 한글 폰트 임베딩(Type0/CID) — **Napkin에 없음**
2. Excalidraw 기반 정밀 벡터 편집
3. Illustrator 최적화 export 파이프라인
4. 프라이버시/무크레딧 구조

### 1.4 약점(개선 대상)
- 비주얼 종류 **5종**(Napkin 30종+)
- 아이콘/데코레이터 **부재**
- 테마/스타일 시스템 부재
- 단발 생성(인라인 문서 흐름 없음)
- 협업/실시간 부재
- 레이아웃 로직이 `switch`에 하드코딩 → 확장 비용 높음

---

## 2. 갭 분석 & 우선순위 매트릭스

영향도(Impact) × 난이도(Effort) 기준. **P0=즉시, P1=핵심, P2=차별화, P3=장기.**

| 갭 | 영향 | 난이도 | 우선 | 페이즈 |
|---|:---:|:---:|:---:|:---:|
| 비주얼 종류 확장(타임라인/벤/프레임워크/카드/차트) | 매우높음 | 중 | **P0** | 1 |
| 자동 레이아웃 엔진(dagre/elk) | 높음 | 중 | **P1** | 1 |
| 아이콘 라이브러리 + 스왑 | 매우높음 | 중 | **P0** | 2 |
| 데코레이터/강조 | 중 | 중 | P2 | 2 |
| 테마/스타일 프리셋 | 높음 | 중 | **P1** | 3 |
| 인라인 문서 생성 UX(멀티 스파크) | 높음 | 높음 | P2 | 4 |
| 실시간 협업 | 중 | 매우높음 | P3 | 5 |
| E2E/관측성/성능 | 높음 | 중 | **P1** | 6 (상시) |

---

## 3. 아키텍처 선결 과제 (Cross-cutting)

신규 기능을 얹기 전에, 확장을 가로막는 두 병목을 먼저 리팩터링한다.

### 3.1 IR 스키마 확장 (`src/types/index.ts`)
현재 IR은 노드/엣지만 표현 → 아이콘·테마·레이아웃 변형·그룹·데이터를 담도록 확장.

```ts
// 확장 예시 (하위호환 유지: 모든 신규 필드 optional)
export interface DiagramNode {
  id: string;
  label: string;
  type?: NodeShape;          // start|process|decision|end|card|...
  color?: string;
  icon?: string;             // [신규] iconify id, e.g. "lucide:rocket"
  emphasis?: "none" | "highlight" | "badge";  // [신규] 데코레이터
  group?: string;            // [신규] 스윔레인/컬럼 그룹핑
  data?: number;             // [신규] 차트/타임라인 값
  meta?: Record<string, unknown>;
}

export interface DiagramIR {
  diagramType: DiagramType;  // 확장된 enum
  title: string;
  description?: string;
  themeId?: string;          // [신규] 테마 프리셋 참조
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}
```

### 3.2 레이아웃 레지스트리 (`src/lib/layout/`)
`ir-to-excalidraw.ts`의 거대한 `switch (diagramType)`를 **플러그형 레지스트리**로 전환.

```
src/lib/layout/
  index.ts              # registerLayout / getLayout(type)
  types.ts              # LayoutFn = (ir, theme) => ExElement[]
  engines/
    auto.ts             # dagre/elk 기반 범용 그래프 레이아웃
    timeline.ts
    venn.ts
    framework-2x2.ts
    pyramid.ts
    funnel.ts
    card-grid.ts
    chart-bar.ts
  legacy/               # 기존 5종 이관
```

→ 새 다이어그램 = "레이아웃 엔진 1개 + 프롬프트 few-shot 1개" 추가로 끝나도록 만든다.
이 리팩터링이 **Phase 1의 진짜 산출물**이며, 이후 모든 비주얼 추가 비용을 상수화한다.

### 3.3 렌더 추상화
레이아웃 엔진은 **중립 RenderNode/RenderEdge**를 반환하고, 어댑터가 Excalidraw 요소로
변환. 추후 다른 렌더 타깃(예: 순수 SVG)으로 확장 여지 확보.

---

## 4. 페이즈별 상세 계획

### Phase 1 — 비주얼 엔진 확장 (5종 → 20종+) 🔴 P0
**목표:** Napkin 대비 최대 격차인 비주얼 다양성 해소 + 확장 비용 상수화.

**에픽**
1. **레이아웃 레지스트리 리팩터링** (3.2) — 기존 5종 무손실 이관, 회귀 테스트 유지(58 tests green).
2. **자동 레이아웃 엔진 도입** — `dagre`(또는 `elkjs`)로 임의 그래프 자동 배치. 현재 수동
   행/열 배치(`layoutFlowchartRows`)를 대체/보강 → 복잡한 분기·사이클에서 겹침 제거.
3. **신규 타입 8종 추가**: `timeline` · `venn` · `framework-2x2` · `pyramid` · `funnel` ·
   `card-grid`(인포그래픽 카드) · `bar-chart` · `swimlane`.
4. **프롬프트 확장** (`src/lib/ai/prompts.ts`) — 타입별 few-shot 예시 + `inferDiagramType`
   분류 개선(텍스트→최적 타입 추천 정확도).

**주요 파일**: `src/lib/layout/*`, `src/lib/ai/ir-to-excalidraw.ts`(어댑터로 축소),
`src/lib/ai/prompts.ts`, `src/types/index.ts`, `src/lib/ai/__tests__/*`

**산출물/검증**: 타입별 통합 테스트(기존 `complex-diagram.test.ts` 패턴 확장) — 각 타입
바인딩 무결성·NaN 없음·겹침 없음. typecheck/lint/build/test 그린.

**추정 규모**: L (가장 큼). **리스크**: dagre 좌표계↔Excalidraw 매핑, 사이클 처리.

---

### Phase 2 — 아이콘 & 비주얼 리치니스 🔴 P0
**목표:** Napkin "감성"의 핵심인 아이콘·강조를 도입해 결과물 품질 급상승.

**에픽**
1. **아이콘 라이브러리 통합** — Iconify(오프라인 서브셋 또는 온디맨드 API). 노드 `icon`
   필드를 Excalidraw에 **이미지/패스 요소**로 삽입.
2. **AI 자동 아이콘 매핑** — 프롬프트가 노드 의미에 맞는 iconify id를 채우도록 학습
   (예: "결제"→`lucide:credit-card`). 실패 시 폴백 없음(아이콘 생략).
3. **아이콘 스왑 UI** — 속성 패널(`PropertiesPanel.tsx`)에 아이콘 검색·교체 섹션 추가.
4. **데코레이터/강조** — `emphasis` 필드 → 배지·하이라이트 테두리·그림자(기존 createShadows
   재사용)로 시각화.

**주요 파일**: `src/lib/icons/*`(신규), `src/features/canvas-editor/PropertiesPanel.tsx`,
`src/lib/ai/ir-to-excalidraw.ts`, `src/lib/ai/prompts.ts`

**추정 규모**: M~L. **리스크**: 아이콘 라이선스(SVG 임베딩), 번들/네트워크, export 시
아이콘이 벡터 PDF에 정상 포함되는지(이미 svg2pdf 경로 검증 자산 활용).

---

### Phase 3 — 테마 & 스타일 시스템 🟠 P1
**목표:** "1클릭 테마 적용"으로 비전문가도 일관된 결과물.

**에픽**
1. **테마 프리셋 정의** (`src/lib/themes/`) — 팔레트 + 폰트 + 라운드니스 + 획 스타일 묶음
   (예: Corporate / Playful / Mono / Pastel / Dark).
2. **테마 적용 엔진** — 레이아웃 산출 요소에 테마를 후처리로 매핑(색/폰트/모서리 일괄).
3. **테마 선택 UI** — 툴바 또는 후보 패널에 테마 스위처. `themeId`를 IR/장면에 영속화.
4. **커스텀 폰트(.ttf) 업로드** — Napkin 벤치마크. 업로드 폰트를 캔버스+벡터 PDF 임베딩에
   연결(기존 `korean-font.ts` 등록 메커니즘 일반화).

**주요 파일**: `src/lib/themes/*`(신규), `src/features/export-pipeline/korean-font.ts`
(폰트 등록 일반화), 툴바/속성 패널, `src/stores/*`

**추정 규모**: M. **리스크**: 테마 변경과 사용자 수동 편집의 충돌 정책(덮어쓰기 vs 보존).

---

### Phase 4 — 생성 UX 혁신 (인라인 문서 흐름) 🟠 P2
**목표:** Napkin식 "긴 글 붙여넣고 문단별 ⚡생성" 경험.

**에픽**
1. **문서 에디터 모드** — 좌측 단일 입력 → 다중 블록 문서(문단 단위).
2. **블록별 스파크** — 문단 호버 시 생성 트리거 → 해당 블록만 시각화, 결과를 캔버스에 누적.
3. **부분 재생성/대체** — 블록 단위 재생성, 캔버스 내 해당 비주얼 교체.
4. **스트리밍 생성 피드백** — 진행 표시 강화.

**주요 파일**: `src/features/text-editor/*`(대개편), `src/features/diagram-generator/*`,
`src/app/api/generate/*`, `src/stores/*`

**추정 규모**: L. **리스크**: 캔버스 다중 비주얼 좌표 충돌, 상태 모델 복잡도 증가.

---

### Phase 5 — 협업 & 클라우드 🟡 P3 (선택)
**목표:** 팀 사용 시나리오. (셀프호스팅 정체성과 충돌하지 않게 "옵션"으로.)

**에픽**
1. **실시간 공동 편집** — Yjs + (Liveblocks 또는 자체 WS) 위에 Excalidraw 협업.
2. **공유 링크/권한** — 문서 공유, 보기/편집 권한. 기존 Supabase Auth/소유권 모델 확장.
3. **댓글/주석** — 요소별 코멘트.

**주요 파일**: `src/lib/collab/*`(신규), `prisma/schema.prisma`, `src/app/api/*`

**추정 규모**: XL. **리스크**: 가장 큼(동시성·인프라). **DB 없이도 동작하는 로컬 모드 보존
필수.**

---

### Phase 6 — 품질·성능·관측성 🟠 P1 (상시 병행)
**목표:** 초대형 변경을 안전하게 진행하기 위한 안전망.

**에픽**
1. **E2E 테스트** — Playwright로 실제 브라우저 생성→편집→**벡터 PDF export** 검증
   (헤드리스 한계로 미뤘던 실물 확인 자동화).
2. **시각 회귀** — 타입별 스냅샷(SVG) 비교.
3. **성능** — 큰 다이어그램 렌더/레이아웃 벤치, 코드 스플리팅(아이콘·차트·svg2pdf 지연 로드).
4. **관측성** — AI 비용/지연/실패율 대시보드(`ApiUsageLog` 활용), 에러 트래킹.
5. **접근성/i18n** — 키보드 내비, 영어 UI 토글.

**주요 파일**: `e2e/*`(신규), `src/lib/ai/usage-log.ts`, CI 워크플로

**추정 규모**: M(지속). 모든 페이즈의 **완료 정의(DoD)**에 포함.

---

## 5. 데이터 모델 변경 (Prisma)
- `Document`: `themeId`, `diagramType`, `irSnapshot`(JSON) 컬럼 추가
- `Asset`(신규): 업로드 폰트/커스텀 아이콘 (소유자 FK)
- `ShareLink`(신규, Phase 5): 토큰·권한·만료
- 마이그레이션은 **하위호환**(모든 신규 nullable), 로컬 모드는 DB 없이 동작 유지.

---

## 6. 신규 의존성 검토
| 용도 | 후보 | 비고 |
|---|---|---|
| 자동 레이아웃 | `dagre` / `elkjs` | elk가 더 강력하나 무겁다 |
| 아이콘 | `@iconify/*` | 오프라인 서브셋 권장(셀프호스팅) |
| 차트 도형화 | 자체 레이아웃(벡터) | Excalidraw 요소로 직접 생성, 외부 차트 라이브러리 회피 |
| 협업 | `yjs` (+ Liveblocks 선택) | Phase 5 |
| E2E | `@playwright/test` | Phase 6 |

원칙: **셀프호스팅·오프라인 가능성을 깨는 의존성은 지양**(아이콘은 번들 서브셋 우선).

---

## 7. 마일스톤 (가정: 단계적 순차 진행, 규모는 상대값)

| 마일스톤 | 내용 | 규모 | 누적 가치 |
|---|---|:---:|---|
| **M1** | 레이아웃 레지스트리 + 자동 레이아웃(Phase 1.1~1.2) | L | 확장 기반 확보 |
| **M2** | 신규 타입 8종 + 프롬프트(Phase 1.3~1.4) | L | **격차 1위 해소** |
| **M3** | 아이콘 통합 + 자동 매핑(Phase 2.1~2.2) | M | **격차 2위 해소** |
| **M4** | 아이콘 스왑/데코레이터(Phase 2.3~2.4) | M | 편집 완성도 |
| **M5** | 테마 시스템 + 커스텀 폰트(Phase 3) | M | 비전문가 UX |
| **M6** | 인라인 문서 생성(Phase 4) | L | UX 패러다임 |
| **M7** | E2E/관측성 정착(Phase 6) | M | 안전망 |
| **M8** | (선택) 협업(Phase 5) | XL | 팀 시장 |

> 각 마일스톤 DoD: typecheck·lint·build·unit·**E2E(M7 이후)** 그린 + 회귀 없음 + 문서 갱신.

---

## 8. 리스크 & 완화
| 리스크 | 영향 | 완화 |
|---|---|---|
| 레이아웃 리팩터링 회귀 | 높음 | 기존 5종 골든 테스트 고정 후 이관, 단계 커밋 |
| 아이콘 export 누락(벡터 PDF) | 중 | svg2pdf 검증 자산으로 헤드리스 회귀 추가 |
| 테마 vs 수동편집 충돌 | 중 | "테마 적용 시 사용자 오버라이드 보존" 정책 명문화 |
| AI 비용/품질 변동 | 중 | 캐시·폴백 유지, 타입별 few-shot로 정확도 방어 |
| 협업 인프라 복잡도 | 매우높음 | Phase 5를 선택·후순위, 로컬 모드 불변 유지 |
| 번들 비대화 | 중 | 아이콘/차트/svg2pdf 지연 로드, 서브셋 |

---

## 9. 성공 지표 (KPI)
- 다이어그램 타입 커버리지: 5 → **20+** (vs Napkin 30+)
- 후보 채택률(생성 후 그대로 export) ↑
- TTFV(입력→첫 비주얼) 단축
- "재편집 없이 export" 비율 ↑ (테마/아이콘 효과)
- E2E 그린 + 시각 회귀 0 (안정성)

---

## 10. 즉시 착수 (첫 스프린트 제안)
가치 대비 위험이 가장 좋은 **M1 → M2 앞부분**부터.

1. `src/lib/layout/` 레지스트리 스캐폴딩 + 기존 5종 무손실 이관 (테스트 그린 유지)
2. `dagre` 도입한 `engines/auto.ts` — flowchart부터 자동 배치로 교체
3. 신규 타입 1종(예: `timeline`) 수직 슬라이스로 끝까지(프롬프트→레이아웃→테스트→export)
   구현해 **"새 타입 추가 비용"을 실측**하고 이후 8종에 일반화

> 이 3개를 한 PR로 묶지 말고, (1) 리팩터링 / (2) auto 엔진 / (3) timeline 슬라이스로
> 분리 커밋·검증한다. (한 번에 너무 많은 파일을 바꾸면 실수 확률 ↑.)

---

## 부록 A. 현재 핵심 파일 맵
- IR/타입: `src/types/index.ts`
- IR→요소 변환·레이아웃: `src/lib/ai/ir-to-excalidraw.ts`
- 프롬프트/파서/캐시: `src/lib/ai/{prompts,parser,cache}.ts`
- 캔버스/편집: `src/features/canvas-editor/{CanvasEditor,PropertiesPanel,LayersPanel}.tsx`
- 내보내기: `src/features/export-pipeline/*` (벡터 PDF·한글 폰트 포함)
- 상태: `src/stores/*`
- 영속화/인증: `src/lib/{persistence,auth}.ts`, `src/lib/supabase/*`

## 부록 B. 비-목표 (Out of Scope)
- 애니메이션/영상 export
- 모바일 네이티브 앱
- Napkin과 동일한 클라우드 크레딧 과금 모델(정체성과 상충)
