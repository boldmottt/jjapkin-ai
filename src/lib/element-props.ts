/**
 * 객체 속성 편집 로직 (순수 함수)
 *
 * Excalidraw 선택 요소에 대한 속성 패치 / 기하 변환(뒤집기·정렬)을
 * 순수 함수로 제공한다. 실제 반영은 호출부에서 updateScene으로 수행.
 */

export interface PropEl {
  id: string;
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
  angle?: unknown;
  points?: unknown;
  [k: string]: unknown;
}

export type AlignMode =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom";

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundingBox(els: readonly PropEl[]): BBox {
  if (els.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const e of els) {
    const x = num(e.x);
    const y = num(e.y);
    const w = num(e.width);
    const h = num(e.height);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }
  return { minX, minY, maxX, maxY };
}

export function getSelected<T extends PropEl>(
  elements: readonly T[],
  ids: ReadonlySet<string>,
): T[] {
  return elements.filter((e) => ids.has(e.id));
}

/** 선택 요소들에 속성 패치 병합 */
export function applyProps<T extends PropEl>(
  elements: readonly T[],
  ids: ReadonlySet<string>,
  patch: Record<string, unknown>,
): T[] {
  return elements.map((e) => (ids.has(e.id) ? { ...e, ...patch } : e));
}

/** 선택 요소들을 선택 영역(bbox) 기준으로 뒤집기 */
export function flipElements<T extends PropEl>(
  elements: readonly T[],
  ids: ReadonlySet<string>,
  axis: "horizontal" | "vertical",
): T[] {
  const sel = getSelected(elements, ids);
  if (sel.length === 0) return [...elements];
  const b = boundingBox(sel);

  return elements.map((e) => {
    if (!ids.has(e.id)) return e;
    const x = num(e.x);
    const y = num(e.y);
    const w = num(e.width);
    const h = num(e.height);

    const patch: Record<string, unknown> = { ...e };
    if (axis === "horizontal") {
      patch.x = b.minX + b.maxX - (x + w);
    } else {
      patch.y = b.minY + b.maxY - (y + h);
    }
    // 각도 반전
    if (typeof e.angle === "number") patch.angle = -e.angle;
    // 선/화살표/자유선 points 미러
    if (Array.isArray(e.points)) {
      patch.points = (e.points as Array<[number, number]>).map(([px, py]) =>
        axis === "horizontal" ? [w - px, py] : [px, h - py],
      );
    }
    return patch as T;
  });
}

/** 선택 요소들을 선택 영역(bbox) 기준으로 정렬 */
export function alignElements<T extends PropEl>(
  elements: readonly T[],
  ids: ReadonlySet<string>,
  mode: AlignMode,
): T[] {
  const sel = getSelected(elements, ids);
  if (sel.length === 0) return [...elements];
  const b = boundingBox(sel);

  return elements.map((e) => {
    if (!ids.has(e.id)) return e;
    const w = num(e.width);
    const h = num(e.height);
    let x = num(e.x);
    let y = num(e.y);

    switch (mode) {
      case "left":
        x = b.minX;
        break;
      case "center":
        x = (b.minX + b.maxX) / 2 - w / 2;
        break;
      case "right":
        x = b.maxX - w;
        break;
      case "top":
        y = b.minY;
        break;
      case "middle":
        y = (b.minY + b.maxY) / 2 - h / 2;
        break;
      case "bottom":
        y = b.maxY - h;
        break;
    }
    return { ...e, x, y } as T;
  });
}

/** 선택 요소들을 균등 간격으로 분배 (3개 이상에서 의미 있음) */
export function distributeElements<T extends PropEl>(
  elements: readonly T[],
  ids: ReadonlySet<string>,
  axis: "horizontal" | "vertical",
): T[] {
  const sel = getSelected(elements, ids);
  if (sel.length < 3) return [...elements];

  const horiz = axis === "horizontal";
  const pos = (e: PropEl) => (horiz ? num(e.x) : num(e.y));
  const size = (e: PropEl) => (horiz ? num(e.width) : num(e.height));

  const sorted = [...sel].sort((a, b) => pos(a) - pos(b));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = pos(last) + size(last) - pos(first);
  const totalSize = sorted.reduce((s, e) => s + size(e), 0);
  const gap = (span - totalSize) / (sorted.length - 1);

  const newPos = new Map<string, number>();
  let cursor = pos(first);
  for (const e of sorted) {
    newPos.set(e.id, cursor);
    cursor += size(e) + gap;
  }

  return elements.map((e) => {
    if (!newPos.has(e.id)) return e;
    const p = newPos.get(e.id)!;
    return horiz ? ({ ...e, x: p } as T) : ({ ...e, y: p } as T);
  });
}

// ── 그림자 ──────────────────────────────────────────

const SHADOWABLE = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "arrow",
  "line",
  "freedraw",
]);

let _shadowSeq = 0;
function defaultShadowId(): string {
  return `shadow_${Date.now().toString(36)}_${(_shadowSeq++).toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/**
 * 선택한 도형들의 그림자(오프셋된 회색 복제본)를 원본 뒤에 추가.
 * Excalidraw에 그림자 속성이 없어 실제 오브젝트로 표현 → 내보내기에도 반영.
 */
export function createShadows<T extends PropEl>(
  elements: readonly T[],
  ids: ReadonlySet<string>,
  opts: {
    dx?: number;
    dy?: number;
    color?: string;
    opacity?: number;
    idGen?: () => string;
  } = {},
): T[] {
  const dx = opts.dx ?? 6;
  const dy = opts.dy ?? 6;
  const color = opts.color ?? "#94a3b8";
  const opacity = opts.opacity ?? 40;
  const idGen = opts.idGen ?? defaultShadowId;

  const out: T[] = [];
  for (const e of elements) {
    if (ids.has(e.id) && SHADOWABLE.has(String(e.type))) {
      const shadow = {
        ...e,
        id: idGen(),
        x: num(e.x) + dx,
        y: num(e.y) + dy,
        backgroundColor: color,
        strokeColor: color,
        fillStyle: "solid",
        opacity,
        roughness: 0,
        boundElements: null,
        containerId: null,
      } as unknown as T;
      out.push(shadow); // 그림자를 원본보다 앞(배열 먼저 = 뒤 레이어)에 배치
    }
    out.push(e);
  }
  return out;
}

// ── UI 보조 ─────────────────────────────────────────

/** 값이 #RRGGBB 형식이면 그대로, 아니면 fallback 반환 */
export function asHex(v: unknown, fallback: string): string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

export const radToDeg = (rad: number): number => Math.round((rad * 180) / Math.PI);
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
