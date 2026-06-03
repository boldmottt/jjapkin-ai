import { describe, it, expect } from "vitest";
import { applyTheme, getTheme, THEMES } from "@/lib/themes";
import type { SceneElement } from "@/lib/scene/types";

const scene: SceneElement[] = [
  { id: "r1", type: "rectangle", x: 0, y: 0, width: 100, height: 60 },
  { id: "t1", type: "text", x: 0, y: 0, width: 80, height: 20, text: "A" },
  { id: "r2", type: "rectangle", x: 0, y: 0, width: 100, height: 60 },
  { id: "a1", type: "arrow", x: 0, y: 0, width: 50, height: 0 },
  { id: "img", type: "image", x: 0, y: 0, width: 22, height: 22 },
];

describe("테마", () => {
  it("THEMES 모두 유효한 팔레트/필드", () => {
    for (const t of THEMES) {
      expect(t.palette.length).toBeGreaterThan(0);
      expect(t.id).toBeTruthy();
    }
  });

  it("도형은 팔레트 순환, 텍스트/화살표는 테마 색", () => {
    const theme = getTheme("corporate")!;
    const out = applyTheme(scene, "corporate");
    const r1 = out.find((e) => e.id === "r1")!;
    const r2 = out.find((e) => e.id === "r2")!;
    expect(r1.backgroundColor).toBe(theme.palette[0]);
    expect(r2.backgroundColor).toBe(theme.palette[1 % theme.palette.length]);
    expect(r1.strokeColor).toBe(theme.stroke);

    const t1 = out.find((e) => e.id === "t1")!;
    expect(t1.strokeColor).toBe(theme.textColor);
    expect(t1.fontFamily).toBe(theme.fontFamily);

    const a1 = out.find((e) => e.id === "a1")!;
    expect(a1.strokeColor).toBe(theme.arrowColor);
  });

  it("image 요소는 변경하지 않음", () => {
    const out = applyTheme(scene, "mono");
    const img = out.find((e) => e.id === "img")!;
    expect(img).toEqual(scene[4]);
  });

  it("rectangle 라운드니스는 테마 rounded에 따름", () => {
    const roundedOut = applyTheme(scene, "corporate"); // rounded true
    const monoOut = applyTheme(scene, "mono"); // rounded false
    expect((roundedOut.find((e) => e.id === "r1") as { roundness?: unknown }).roundness).toEqual({ type: 3 });
    expect((monoOut.find((e) => e.id === "r1") as { roundness?: unknown }).roundness).toBeNull();
  });

  it("미지의 테마는 원본 유지", () => {
    expect(applyTheme(scene, "__nope__")).toEqual(scene);
  });
});
