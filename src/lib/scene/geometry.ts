/**
 * Scene 요소 공통 기하 / 술어 유틸
 *
 * num()·boundingBox()와 요소 종류 판별이 element-props·layers·PropertiesPanel에
 * 흩어져 중복돼 있었다. 여기로 통합한다(단일 출처).
 */

import type { SceneElement } from "./types";

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** unknown 값을 유한수로 강제(아니면 fallback). 좌표/수치 접근의 표준 방어. */
export function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** 선택 요소들의 경계 상자 */
export function boundingBox(els: readonly SceneElement[]): BBox {
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

// ── 요소 종류 술어 ──────────────────────────────────

type Typed = { type?: unknown };

export const isText = (e: Typed): boolean => e.type === "text";
export const isRect = (e: Typed): boolean => e.type === "rectangle";
export const isArrow = (e: Typed): boolean => e.type === "arrow";

/** 그림자를 만들 수 있는 도형 종류 */
export const SHADOWABLE: ReadonlySet<string> = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "arrow",
  "line",
  "freedraw",
]);

export const isShadowable = (e: Typed): boolean =>
  SHADOWABLE.has(String(e.type));
