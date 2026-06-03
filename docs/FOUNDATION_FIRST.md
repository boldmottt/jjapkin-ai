# JJapkin AI — 기초공사 우선 실행 순서 (Foundation First)

> 버전 1.0 · 2026-06-03 · 동반 문서: `docs/IMPROVEMENT_PLAN.md`(기능 로드맵)
> 원칙: **"기능은 100% 동일하게 유지하되, 무겁고 복잡한 구현을 영리하게 단순화"**.
> 새 기능을 얹기 전에 토대를 단단히 한다. 모든 리팩터는 **동작 불변 + 테스트로 고정 +
> 분리 커밋**. 최종 목표는 **Napkin AI 수준의 디자인 산출(타입·아이콘·테마) 동등성**.

---

## 0. 코드 감사 결과 (근거 기반)

실제 코드를 측정해 확인한 "쓸데없이 무겁고 복잡한" 지점.

| # | 문제 | 근거(측정값) | 처방 |
|---|---|---|---|
| A | **죽은 상태 스토어** `useAiPipelineStore` 전체 | 외부 사용처 **0** (크레딧·모델선택·캐시토글). 주석 자인: "진실의 원천 아님" | **삭제** |
| B | **미사용 레이아웃 상태** `textPanelRatio`·`setTextPanelRatio`·`toggleCandidatePanel` | 외부 사용처 **0** | **삭제** |
| C | **요소 타입 4중 난립** `ExElement`/`ExcalidrawElement`/`PropEl`/`SceneEl` | `as unknown as` 캐스트 CanvasEditor에만 **7회** | **단일 `SceneElement`로 통합** |
| D | **기하/유틸 중복** `num()`·`boundingBox`·요소술어 | element-props·layers·ir-변환기에 분산 | **`lib/scene`로 통합** |
| E | **레이아웃 거대 switch + 매직넘버** | `layoutNodes` 1함수 ~130줄, `400/300/180` 하드코딩 | **레지스트리 + 상수/테마화** |
| F | **엣지 라벨 미렌더** | `_label` 전달만, 렌더 코드 없음 | (기능공사에서) **라벨 렌더 추가** |
| G | **테스트 죽은 표현** | `nanCoords + (… ? 0 : 0)` 항상 +0 | 정리 |

> 핵심 통찰: C·D·E는 서로 얽혀 있다. **단일 요소 타입(C)** 위에 **공통 기하(D)**를 놓고,
> 그 위에 **레이아웃 레지스트리(E)**를 세우면 — 이후 모든 기능(타입·아이콘·테마)이
> 캐스트 없이 깔끔하게 확장된다. 이것이 "기초공사"의 실체다.

---

## 1. 기초공사 실행 순서 (F1 → F5)

각 단계는 **그 자체로 출시 가능(동작 불변)** 하며 독립 커밋한다. 위험도 낮은 순 → 토대 핵심 순.

### F1. 죽은 코드 제거 🟢 (위험 0, 첫 벽돌)
- `useAiPipelineStore` 전체 삭제(크레딧 개념 폐기 — 1인 BYO 키엔 무의미).
- `EditorLayoutStore`에서 `textPanelRatio`/`setTextPanelRatio`/`toggleCandidatePanel` 삭제.
- 테스트 죽은 표현(G) 정리.
- **검증**: typecheck·lint·build·test 그린. 동작 변화 0.
- **파일**: `src/stores/index.ts`, `src/lib/ai/__tests__/complex-diagram.test.ts`

### F2. 단일 Scene 요소 타입 도입 🟢 (캐스트 박멸)
- `src/lib/scene/types.ts`에 **`SceneElement`** 단일 정의(현 4개 타입의 합집합, 모든 선택 필드 optional).
- `ExElement`/`PropEl`/`SceneEl`/`ExcalidrawElement`를 `SceneElement`로 치환(또는 `= SceneElement` 별칭).
- CanvasEditor의 `as unknown as` **7회 → 0**.
- **검증**: typecheck 그린(캐스트 없이도 통과해야 함) + 기존 테스트 그린.
- **파일**: `src/lib/scene/types.ts`(신규), `ir-to-excalidraw.ts`, `element-props.ts`,
  `layers.ts`, `ExcalidrawWrapper.tsx`, `CanvasEditor.tsx`, `PropertiesPanel.tsx`

### F3. 공통 Scene 기하/유틸 통합 🟢
- `src/lib/scene/geometry.ts`: `num`·`boundingBox`·`isText/isRect/isArrow/isShadowable` 한곳.
- element-props·layers의 중복 제거 후 재사용.
- **검증**: 기존 `element-props.test.ts`·`layers.test.ts` 그대로 그린(시그니처 보존).

### F4. 레이아웃 레지스트리 + 어댑터 분리 🟡 (토대의 핵심)
- `src/lib/layout/`로 `layoutNodes` switch 해체 → 타입별 `LayoutFn` 플러그.
- 매직넘버(`400/300/180`, gap/size)를 상수/테마 토큰으로 추출.
- IR→요소 변환기는 "레이아웃 호출 + Excalidraw 어댑터"로 **얇게** 축소.
- **안전망**: 리팩터 직전 현 5종 출력을 **골든 스냅샷 테스트**로 고정 → 리팩터 후 바이트 동일 보장.
- **검증**: 골든 스냅샷 + 기존 통합 테스트 그린.
- **파일**: `src/lib/layout/*`(신규), `ir-to-excalidraw.ts`(축소), `__tests__/*`

### F5. 회귀 안전망 구축 🟡 (이후 모든 변경 방어)
- **골든 스냅샷**: 5종 + 복잡 플로우차트 출력 JSON 고정.
- **Playwright E2E 1개**: 생성→편집→**벡터 PDF export** 실제 브라우저 검증(헤드리스로 미뤘던 실물).
- CI에 typecheck·lint·test·e2e 게이트.
- **파일**: `e2e/*`(신규), CI 워크플로

> **F1~F3는 며칠 내 안전하게 완료 가능(저위험·고정리효과). F4가 진짜 토대.**
> F4까지 끝나면 "새 다이어그램 타입 추가 = 레이아웃 1 + 프롬프트 1"로 상수화된다.

---

## 2. 본공사 — Napkin 디자인 동등성 (깨끗한 토대 위에서)

> 목표: **"냅킨에서 되는 디자인은 나도 된다."** = 비주얼 타입 + 아이콘 + 테마 3축.
> 상세는 `IMPROVEMENT_PLAN.md`. 여기선 **순서**만 고정.

| 순서 | 본공사 | 의존(선행 토대) | Napkin 패리티 기여 |
|:---:|---|---|---|
| **B1** | 비주얼 타입 8종 확장(타임라인/벤/2x2/피라미드/퍼널/카드/막대/스윔레인) | F4 | ★★★ (다양성) |
| **B2** | 아이콘 라이브러리 + AI 자동 매핑 + 스왑 UI | F2·F3 | ★★★ (감성/완성도) |
| **B3** | 테마/스타일 프리셋 + 커스텀 폰트 | F2·F3·B1 | ★★ (일관성) |
| **B4** | 데코레이터/강조 + **엣지 라벨 렌더**(감사 F항목) | F2·B2 | ★★ |
| **B5** | 개인 생산성(템플릿·스니펫·⌘K·로컬 히스토리) | F1·F2 | (1인 속도) |
| **B6** | 인라인 문서 생성(긴 글→문단별) | B1 | (1인 정리) |

---

## 3. 통합 개발 순서 (진행 상황)

```
F1 죽은코드 → F2 단일타입 → F3 공통기하 → F4 레이아웃레지스트리 → F5 안전망   [✅ 완료]
  └─(기초공사: 동작 불변, 토대 완성 — 골든 스냅샷으로 증명)─┘
→ B1 타입확장 → B2 아이콘 → B3 테마 → B4 데코/라벨 → B5 개인생산성 → B6 인라인생성  [✅ 완료]
  └─(본공사: Napkin 디자인 동등성 달성)─┘
```

### 달성 현황
- **기초공사 F1~F5**: 죽은 코드 제거, 단일 `SceneElement`(캐스트 7→0), 공통 기하
  통합, 레이아웃 레지스트리, 골든 스냅샷+벡터PDF 회귀 테스트+CI 게이트.
- **B1**: 다이어그램 타입 **5종 → 13종**(timeline·card-grid·framework-2x2·
  pyramid·funnel·venn·bar-chart·swimlane). 새 타입 = 엔진1+등록.
- **B2**: 오프라인 아이콘(lucide) AI 자동 매핑 + 이미지 요소 렌더 + 스왑 UI.
- **B3**: 테마 프리셋 5종 + 1클릭 적용.
- **B4**: 엣지 라벨 렌더 + 강조 데코레이터(highlight/badge).
- **B5**: 커맨드 팔레트(⌘K) + 프롬프트 스니펫/템플릿.
- **B6**: 문단별 인라인 생성(⚡).
- 테스트 58 → **120개**, 전 구간 typecheck·lint·build·test 그린.

## 4. 불변 원칙 (모든 단계 공통 DoD)
- 기능/출력 **동일** (기초공사 구간) — 골든 스냅샷으로 증명
- typecheck·lint·build·test(이후 e2e) **그린**
- **분리 커밋** (한 PR에 여러 관심사 X — 실수 확률↑)
- 새 추상화는 **죽은 코드를 만들지 않는다**(YAGNI: 지금 쓰는 것만)
