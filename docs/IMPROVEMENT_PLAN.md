# JJapkin AI — 초대형 개선 프로젝트 계획서 (1인 사용 에디션)

> 버전 1.1 · 작성일 2026-06-03 · 대상 브랜치 `claude/jjapkin-code-review-DCJFd`
> **전제: 단일 사용자(나 혼자) 전용.** 협업·공유·팀·권한·댓글 등 멀티유저 기능은 전부
> 비-목표(out of scope). 모든 의사결정은 "1인 파워유저의 생산성·결과물 품질"을 기준으로 한다.

---

## 0. 전략 개요

### 0.1 비전
> **"나 혼자 쓰는, 한글을 가장 잘 다루는 로컬-퍼스트 텍스트→비주얼 엔진."**

Napkin AI의 협업·SaaS 노선을 따라가지 않는다. 대신 **혼자 빠르게, 내 데이터는 내 기기에,
크레딧 없이, 벡터로 정밀하게** 만드는 1인 워크플로우를 극한까지 다듬는다.

### 0.2 1인 사용 관점의 설계 원칙
1. **로컬-퍼스트**: 로그인·서버 없이 100% 동작이 기본. 클라우드는 "내 여러 기기 간
   동기화" 용도의 **선택적** 부가기능일 뿐(타인 공유 아님).
2. **무크레딧 / BYO 키**: 내 API 키로 무제한. 과금·워터마크 없음.
3. **속도 > 범용성**: 자주 쓰는 흐름(텍스트→생성→약간 편집→export)을 키보드 중심으로 단축.
4. **재사용**: 내가 만든 스타일·프롬프트·다이어그램을 개인 자산으로 축적·재활용.
5. **단순함 유지**: 멀티유저용 복잡도(권한·동시성·실시간)를 일절 들이지 않는다.

### 0.3 North Star Metric
**TTFV(입력→첫 만족 비주얼까지 시간)** + **재사용률(내 템플릿/스타일 재활용 비중)**.
협업 지표(초대·공유·동시편집)는 추적하지 않는다.

---

## 1. 현재 상태 (As-Is)

### 1.1 기술 스택
Next.js 14(App Router) · TypeScript(strict) · Tailwind+shadcn/ui · Excalidraw ·
Zustand+React Query · DeepSeek→OpenAI→Claude 폴백 · Prisma+Supabase(선택) · Vercel/로컬.

### 1.2 구현된 기능
- AI 파이프라인: 3-폴백 체인, 프롬프트/파서/캐시, 사용량 로깅, 레이트리밋
- **5종 레이아웃**: flowchart·mindmap·process·comparison·list (`src/lib/ai/ir-to-excalidraw.ts`)
- 3-후보 생성 + 선택 패널
- Excalidraw 편집기 + **레이어 패널** + **Illustrator급 속성 패널**
- 내보내기: PNG·SVG·PPTX·PDF(이미지)·**벡터 PDF(한글 임베딩)**·AI-SVG·AI-PDF
- **로컬 모드(localStorage)** + 선택적 Supabase Auth/DB(미설정 시 익명 로컬)
- 토스트·로딩·에러 UX, 원클릭 런처, 58개 테스트

### 1.3 핵심 자산(강점, 1인 관점에서 그대로 유효)
1. 벡터 PDF + 한글 폰트 임베딩(Type0/CID)
2. Excalidraw 기반 정밀 벡터 편집
3. Illustrator 최적화 export
4. **로컬-퍼스트 / 무크레딧 / 프라이버시** — 1인 사용에 이상적

### 1.4 약점(개선 대상)
- 비주얼 종류 **5종**(다양성 부족)
- 아이콘/데코레이터 **부재**
- 테마/스타일 시스템 부재 → 매번 수동 꾸미기
- 단발 생성(긴 글을 한 번에 시각화하는 흐름 없음)
- 내가 만든 결과를 **재사용할 개인 자산 시스템 부재**
- 레이아웃 로직이 `switch`에 하드코딩 → 확장 비용 높음

---

## 2. 갭 분석 & 우선순위 (1인 사용 기준 재정렬)

협업 항목은 **삭제**. 영향도는 "내 생산성·결과물 품질"로 재평가.

| 갭 | 1인 영향 | 난이도 | 우선 | 페이즈 |
|---|:---:|:---:|:---:|:---:|
| 비주얼 종류 확장(타임라인/벤/프레임워크/카드/차트) | 매우높음 | 중 | **P0** | 1 |
| 자동 레이아웃 엔진(dagre) | 높음 | 중 | **P1** | 1 |
| 아이콘 라이브러리 + 스왑 | 매우높음 | 중 | **P0** | 2 |
| 데코레이터/강조 | 중 | 중 | P2 | 2 |
| 테마/스타일 프리셋 | 높음 | 중 | **P1** | 3 |
| **개인 자산: 템플릿·스니펫·프롬프트 프리셋** | 높음 | 낮음 | **P1** | 5 |
| **로컬 버전 히스토리 / 빠른 되돌리기** | 중 | 낮음 | P2 | 5 |
| **키보드 중심 워크플로우** | 중 | 낮음 | P2 | 5 |
| 인라인 문서 생성(긴 글→문단별 시각화) | 높음 | 높음 | P2 | 4 |
| E2E/성능/개인 비용 추적 | 높음 | 중 | **P1** | 6 (상시) |
| ~~실시간 협업/공유/권한~~ | — | — | ❌삭제 | — |

---

## 3. 아키텍처 선결 과제 (Cross-cutting)

### 3.1 IR 스키마 확장 (`src/types/index.ts`)
하위호환 유지(신규 필드 전부 optional).

```ts
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
`ir-to-excalidraw.ts`의 거대한 `switch (diagramType)`를 플러그형 레지스트리로 전환.
새 다이어그램 = "레이아웃 엔진 1개 + 프롬프트 few-shot 1개"로 끝나게 만든다.

```
src/lib/layout/
  index.ts              # registerLayout / getLayout(type)
  types.ts              # LayoutFn = (ir, theme) => RenderNode[]
  engines/
    auto.ts             # dagre 기반 범용 그래프 레이아웃
    timeline.ts  venn.ts  framework-2x2.ts  pyramid.ts
    funnel.ts    card-grid.ts  chart-bar.ts  swimlane.ts
  legacy/               # 기존 5종 이관
```

### 3.3 렌더 추상화
레이아웃 엔진은 중립 `RenderNode/RenderEdge`를 반환, 어댑터가 Excalidraw 요소로 변환.

---

## 4. 페이즈별 상세 계획

### Phase 1 — 비주얼 엔진 확장 (5종 → 20종+) 🔴 P0
**목표:** 다양성 격차 해소 + 확장 비용 상수화.

**에픽**
1. **레이아웃 레지스트리 리팩터링**(3.2) — 기존 5종 무손실 이관, 58 테스트 그린 유지.
2. **자동 레이아웃 엔진**(`dagre`) — 복잡한 분기·사이클에서 겹침 제거.
3. **신규 타입 8종**: `timeline`·`venn`·`framework-2x2`·`pyramid`·`funnel`·
   `card-grid`(인포그래픽 카드)·`bar-chart`·`swimlane`.
4. **프롬프트 확장**(`src/lib/ai/prompts.ts`) — 타입별 few-shot + `inferDiagramType` 개선.

**주요 파일**: `src/lib/layout/*`, `src/lib/ai/ir-to-excalidraw.ts`(어댑터로 축소),
`src/lib/ai/prompts.ts`, `src/types/index.ts`, `src/lib/ai/__tests__/*`
**검증**: 타입별 통합 테스트(`complex-diagram.test.ts` 패턴 확장) — 바인딩 무결성·NaN 없음.
**규모**: L. **리스크**: dagre↔Excalidraw 좌표 매핑, 사이클 처리.

---

### Phase 2 — 아이콘 & 비주얼 리치니스 🔴 P0
**목표:** 결과물 품질 급상승(혼자 봐도, 발표에 써도 보기 좋게).

**에픽**
1. **아이콘 라이브러리 통합** — Iconify **오프라인 서브셋**(셀프호스팅·오프라인 보장).
   노드 `icon` → Excalidraw 이미지/패스 요소로 삽입.
2. **AI 자동 아이콘 매핑** — 프롬프트가 노드 의미에 맞는 iconify id를 채움.
3. **아이콘 스왑 UI** — `PropertiesPanel.tsx`에 아이콘 검색·교체 섹션.
4. **데코레이터/강조** — `emphasis` → 배지·하이라이트·그림자(기존 `createShadows` 재사용).

**검증**: 아이콘이 **벡터 PDF에 정상 포함**되는지 헤드리스 회귀(기존 svg2pdf 검증 자산 활용).
**규모**: M~L. **리스크**: 아이콘 라이선스, 번들 크기(서브셋으로 완화).

---

### Phase 3 — 테마 & 스타일 시스템 🟠 P1
**목표:** 매번 수동으로 꾸미지 않도록 "1클릭 테마".

**에픽**
1. **테마 프리셋**(`src/lib/themes/`) — 팔레트+폰트+라운드니스+획 묶음
   (Corporate/Playful/Mono/Pastel/Dark).
2. **테마 적용 엔진** — 레이아웃 산출 요소에 후처리 매핑. **내 수동 편집은 보존**.
3. **테마 스위처 UI** — 툴바/후보 패널. `themeId` 영속화.
4. **커스텀 폰트(.ttf) 업로드** — 캔버스+벡터 PDF 임베딩 연결(`korean-font.ts` 일반화).

**규모**: M. **리스크**: 테마 적용 vs 수동 편집 충돌 → "오버라이드 보존" 정책.

---

### Phase 4 — 생성 UX: 긴 글 한 방에 🟠 P2
**목표:** 메모/문서 전체를 붙여넣고 문단별로 빠르게 시각화(혼자 정리할 때 강력).

**에픽**
1. **문서 블록 입력** — 단일 입력 → 문단 블록.
2. **블록별 생성** — 문단 호버 시 트리거, 캔버스에 누적.
3. **부분 재생성/대체** — 블록 단위 재생성·교체.
4. **스트리밍 진행 피드백**.

**주요 파일**: `src/features/text-editor/*`, `src/features/diagram-generator/*`,
`src/app/api/generate/*`, `src/stores/*`
**규모**: L. **리스크**: 캔버스 다중 비주얼 좌표 충돌, 상태 복잡도.

---

### Phase 5 — 개인 생산성 & 워크플로우 🟠 P1 (협업 대체)
> 기존 계획의 "협업" 자리를 **1인 파워유저 도구**로 전면 교체.

**에픽**
1. **개인 템플릿 라이브러리** — 내가 만든 다이어그램을 템플릿으로 저장→재사용.
   로컬(localStorage/IndexedDB) 우선, DB 있으면 동기화.
2. **프롬프트/스니펫 프리셋** — 자주 쓰는 입력·지시문을 저장하고 한 번에 불러오기.
3. **로컬 버전 히스토리** — 문서별 스냅샷 타임라인 + 되돌리기(다이어그램 단위 undo 보강).
   (`src/stores/diagram-history.ts` 확장)
4. **키보드 중심 워크플로우** — 생성/내보내기/패널 토글/후보 전환 단축키, 커맨드 팔레트(⌘K).
5. **내 기기 간 동기화(선택)** — 단일 계정(나)의 여러 기기 동기화. **타인 공유 아님.**
   기존 Supabase Auth/소유권 모델을 "1인 멀티디바이스"로 단순 활용.

**주요 파일**: `src/lib/templates/*`(신규), `src/stores/*`,
`src/features/text-editor/*`, 커맨드 팔레트 컴포넌트(신규)
**규모**: M (대부분 낮은 난이도·높은 체감). **리스크**: 낮음.

---

### Phase 6 — 품질·성능·개인 관측성 🟠 P1 (상시 병행)
**목표:** 초대형 변경을 안전하게 + 내 API 비용을 내가 본다.

**에픽**
1. **E2E**(Playwright) — 실제 브라우저 생성→편집→**벡터 PDF export** 검증(실물 확인 자동화).
2. **시각 회귀** — 타입별 SVG 스냅샷 비교.
3. **성능** — 큰 다이어그램 렌더/레이아웃 벤치, 아이콘·차트·svg2pdf **지연 로드**.
4. **개인 비용/사용 대시보드** — `ApiUsageLog` 기반 내 토큰·비용·실패율(혼자 보는 용도).
5. **접근성/단축키 문서화**.

**규모**: M(지속). 모든 페이즈 **완료 정의(DoD)**에 포함.

---

## 5. 데이터 모델 (1인 기준 — 협업 스키마 제거)
- 기본은 **DB 없이 로컬**(localStorage/IndexedDB). DB는 "내 기기 간 동기화" 선택 옵션.
- `Document`: `themeId`, `diagramType`, `irSnapshot`(JSON) 추가
- `Template`(신규): 개인 템플릿(소유자=나)
- `Asset`(신규): 업로드 폰트/커스텀 아이콘
- `Snapshot`(신규): 로컬 버전 히스토리(서버 동기화 시에만 DB)
- ❌ 제거: `ShareLink`, 권한/멤버십/댓글 등 모든 멀티유저 테이블
- 마이그레이션은 하위호환(전부 nullable), **로컬 모드 불변**.

---

## 6. 신규 의존성 (1인·오프라인 우선)
| 용도 | 후보 | 비고 |
|---|---|---|
| 자동 레이아웃 | `dagre` | 가볍고 충분 (elk는 과함) |
| 아이콘 | `@iconify/*` **오프라인 서브셋** | 셀프호스팅·오프라인 보장 |
| 차트 도형화 | 자체 벡터 레이아웃 | 외부 차트 라이브러리 회피 |
| 커맨드 팔레트 | `cmdk` (경량) | ⌘K |
| E2E | `@playwright/test` | Phase 6 |
| ❌ 협업 | ~~yjs / Liveblocks~~ | **불필요 — 도입 안 함** |

원칙: **로컬·오프라인 동작을 깨는 의존성 금지.**

---

## 7. 마일스톤 (협업 M8 삭제, 개인 생산성 마일스톤 추가)

| 마일스톤 | 내용 | 규모 | 1인 체감 가치 |
|---|---|:---:|---|
| **M1** | 레이아웃 레지스트리 + dagre auto(Phase 1.1~1.2) | L | 확장 기반 |
| **M2** | 신규 타입 8종 + 프롬프트(Phase 1.3~1.4) | L | **다양성 해소** |
| **M3** | 아이콘 통합 + 자동 매핑(Phase 2.1~2.2) | M | **품질 급상승** |
| **M4** | 아이콘 스왑/데코레이터(Phase 2.3~2.4) | M | 편집 완성도 |
| **M5** | 테마 시스템 + 커스텀 폰트(Phase 3) | M | 수동 꾸미기 제거 |
| **M6** | **개인 자산: 템플릿·스니펫·단축키·히스토리(Phase 5)** | M | **반복 작업 단축** |
| **M7** | 인라인 문서 생성(Phase 4) | L | 긴 글 정리 |
| **M8** | E2E/성능/개인 비용 대시보드(Phase 6) | M | 안정성·비용 가시성 |

> DoD: typecheck·lint·build·unit·**E2E(M8 이후)** 그린 + 회귀 없음 + 문서 갱신.

---

## 8. 리스크 & 완화 (협업 리스크 제거)
| 리스크 | 영향 | 완화 |
|---|---|---|
| 레이아웃 리팩터링 회귀 | 높음 | 기존 5종 골든 테스트 고정 후 이관, 단계 커밋 |
| 아이콘 export 누락(벡터 PDF) | 중 | svg2pdf 검증 자산으로 헤드리스 회귀 추가 |
| 테마 vs 수동편집 충돌 | 중 | "오버라이드 보존" 정책 명문화 |
| AI 비용/품질 변동 | 중 | 캐시·폴백 유지, 타입별 few-shot, 개인 비용 대시보드 |
| 번들 비대화 | 중 | 아이콘/차트/svg2pdf 지연 로드, 서브셋 |
| ~~동시성/협업 인프라~~ | — | **해당 없음(협업 미도입)** |

---

## 9. 성공 지표 (KPI — 1인 기준)
- 다이어그램 타입 커버리지: 5 → **20+**
- TTFV(입력→첫 비주얼) 단축
- **재사용률**: 내 템플릿/스니펫/테마 재활용 비중 ↑
- "재편집 없이 export" 비율 ↑(테마·아이콘 효과)
- E2E 그린 + 시각 회귀 0
- (참고) 내 월 API 비용 가시화
- ❌ 추적 안 함: 초대·공유·동시편집·MAU 등 멀티유저 지표

---

## 10. 즉시 착수 (첫 스프린트)
가치 대비 위험이 가장 좋은 **M1 → M2 앞부분**.

1. `src/lib/layout/` 레지스트리 스캐폴딩 + 기존 5종 무손실 이관(테스트 그린 유지)
2. `dagre` 도입한 `engines/auto.ts` — flowchart부터 자동 배치로 교체
3. 신규 타입 1종(`timeline`)을 수직 슬라이스로 끝까지(프롬프트→레이아웃→테스트→export)
   구현해 **"새 타입 추가 비용"을 실측**

> (1) 리팩터링 / (2) auto 엔진 / (3) timeline 슬라이스로 **분리 커밋·검증**.
> 한 PR에 너무 많은 파일을 몰지 않는다(실수 확률 ↑).
>
> **빠른 승리(low-effort, 병행 가능):** Phase 5의 커맨드 팔레트(⌘K)·단축키·프롬프트
> 스니펫은 난이도가 낮고 1인 체감이 커서, 큰 페이즈 사이에 끼워 넣기 좋다.

---

## 부록 A. 현재 핵심 파일 맵
- IR/타입: `src/types/index.ts`
- IR→요소 변환·레이아웃: `src/lib/ai/ir-to-excalidraw.ts`
- 프롬프트/파서/캐시: `src/lib/ai/{prompts,parser,cache}.ts`
- 캔버스/편집: `src/features/canvas-editor/{CanvasEditor,PropertiesPanel,LayersPanel}.tsx`
- 내보내기: `src/features/export-pipeline/*` (벡터 PDF·한글 폰트 포함)
- 히스토리/상태: `src/stores/*` (`diagram-history.ts` 포함)
- 영속화: `src/lib/persistence.ts` (로컬-퍼스트)

## 부록 B. 비-목표 (Out of Scope) — 1인 사용으로 확정
- **협업 전반**: 실시간 공동편집, 공유 링크, 권한/멤버십, 댓글, 팀스페이스
- 크레딧/과금/워터마크
- 애니메이션/영상 export
- 모바일 네이티브 앱
- (인증/DB는 "내 기기 간 동기화" 용도로만 선택적 유지 — 타인 공유 목적 아님)
