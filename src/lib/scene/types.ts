/**
 * Scene 요소 단일 정규 타입
 *
 * 그동안 "Excalidraw 요소"를 4개 타입(ExElement/ExcalidrawElement/PropEl/SceneEl)이
 * 제각기 느슨하게 표현해, 모듈 경계마다 `as unknown as` 캐스트가 필요했다.
 * 이 파일의 `SceneElement` 하나로 통합한다.
 *
 * 설계:
 *  - 식별 필드(id·type)는 필수.
 *  - 기하(x·y·width·height)는 선택 `number`. 실제 요소는 항상 갖지만, 순수
 *    기하 연산은 방어적으로 다루므로(없으면 0) optional로 둔다(unknown→number 강화).
 *  - 그 외 Excalidraw 속성은 선택. 자주 접근하는 것만 타입을 달고, 나머지는
 *    인덱스 시그니처(`[k]: unknown`)로 허용 → 캐스트 없이 임의 속성 접근 가능.
 */
export interface SceneElement {
  id: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;

  // ── 텍스트 ──
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  containerId?: string | null;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";

  // ── 도형 공통 ──
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  fillStyle?: string;
  roughness?: number;
  roundness?: unknown;
  angle?: number;
  opacity?: number;
  locked?: boolean;
  isDeleted?: boolean;

  // ── 화살표 / 선 ──
  startBinding?: { elementId: string; focus: number; gap: number };
  endBinding?: { elementId: string; focus: number; gap: number };
  points?: [number, number][];

  // ── 그룹 / 바인딩 ──
  groupIds?: string[];
  boundElements?: { id: string; type: string }[] | null;

  // 그 외 임의 Excalidraw 속성
  [k: string]: unknown;
}
