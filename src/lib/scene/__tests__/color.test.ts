import { describe, it, expect } from "vitest";
import {
  relativeLuminance,
  idealTextColor,
  harmonize,
} from "@/lib/scene/color";

describe("대비/휘도", () => {
  it("흰 배경은 어두운 텍스트, 검은 배경은 밝은 텍스트", () => {
    expect(idealTextColor("#ffffff")).toBe("#1F2937");
    expect(idealTextColor("#000000")).toBe("#F8FAFC");
  });
  it("진한 파랑 위는 밝은 텍스트", () => {
    expect(idealTextColor("#1E3A8A")).toBe("#F8FAFC");
  });
  it("연한 파스텔 위는 어두운 텍스트", () => {
    expect(idealTextColor("#DBEAFE")).toBe("#1F2937");
  });
  it("transparent/undefined는 어두운 텍스트", () => {
    expect(idealTextColor("transparent")).toBe("#1F2937");
    expect(idealTextColor(undefined)).toBe("#1F2937");
  });
  it("휘도는 0~1", () => {
    const v = relativeLuminance("#808080");
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
  });
});

describe("팔레트 하모니", () => {
  it("요청 개수만큼 유효 hex 생성", () => {
    const p = harmonize("#3B82F6", 5);
    expect(p).toHaveLength(5);
    for (const c of p) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
  it("결정적(동일 시드 → 동일 결과)", () => {
    expect(harmonize("#EF4444", 4)).toEqual(harmonize("#EF4444", 4));
  });
  it("잘못된 시드도 기본 시드로 생성", () => {
    expect(harmonize("nope", 3)).toHaveLength(3);
  });
});
