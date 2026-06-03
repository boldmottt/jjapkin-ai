import { describe, it, expect } from "vitest";
import {
  num,
  boundingBox,
  isText,
  isRect,
  isArrow,
  isShadowable,
  SHADOWABLE,
} from "@/lib/scene/geometry";
import type { SceneElement } from "@/lib/scene/types";

describe("num", () => {
  it("유한수는 그대로", () => {
    expect(num(42)).toBe(42);
    expect(num(0)).toBe(0);
    expect(num(-3.5)).toBe(-3.5);
  });
  it("비수/무한/NaN은 fallback", () => {
    expect(num(undefined)).toBe(0);
    expect(num("10")).toBe(0);
    expect(num(NaN)).toBe(0);
    expect(num(Infinity)).toBe(0);
    expect(num(undefined, 7)).toBe(7);
  });
});

describe("boundingBox", () => {
  const els: SceneElement[] = [
    { id: "a", type: "rectangle", x: 0, y: 0, width: 100, height: 50 },
    { id: "b", type: "rectangle", x: 200, y: 100, width: 50, height: 50 },
  ];
  it("경계 상자 계산", () => {
    expect(boundingBox(els)).toEqual({ minX: 0, minY: 0, maxX: 250, maxY: 150 });
  });
  it("빈 입력은 0 박스", () => {
    expect(boundingBox([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });
  it("좌표 누락 요소는 0으로 방어", () => {
    expect(boundingBox([{ id: "x", type: "rectangle" }])).toEqual({
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    });
  });
});

describe("요소 술어", () => {
  it("isText/isRect/isArrow", () => {
    expect(isText({ type: "text" })).toBe(true);
    expect(isText({ type: "rectangle" })).toBe(false);
    expect(isRect({ type: "rectangle" })).toBe(true);
    expect(isArrow({ type: "arrow" })).toBe(true);
  });
  it("isShadowable: 도형 종류만 true", () => {
    for (const t of Array.from(SHADOWABLE)) {
      expect(isShadowable({ type: t })).toBe(true);
    }
    expect(isShadowable({ type: "text" })).toBe(false);
    expect(isShadowable({ type: undefined })).toBe(false);
  });
});
