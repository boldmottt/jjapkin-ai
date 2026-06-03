import { describe, it, expect } from "vitest";
import { applyEditOps } from "@/lib/scene/edit";
import { parseEditResponse } from "@/lib/ai/edit-parser";
import type { SceneElement } from "@/lib/scene/types";

const scene: SceneElement[] = [
  { id: "r1", type: "rectangle", x: 0, y: 0, width: 160, height: 60, backgroundColor: "#ffffff" },
  { id: "t1", type: "text", x: 0, y: 0, width: 140, height: 20, text: "원래", containerId: "r1" },
  { id: "r2", type: "rectangle", x: 200, y: 0, width: 160, height: 60 },
];
const sel = new Set(["r1"]);

describe("applyEditOps", () => {
  it("recolor는 배경 + 바운드 텍스트 대비 보정", () => {
    const out = applyEditOps(scene, sel, [{ op: "recolor", color: "#1E3A8A" }]);
    expect(out.find((e) => e.id === "r1")!.backgroundColor).toBe("#1E3A8A");
    // 어두운 배경 → 밝은 텍스트
    expect(out.find((e) => e.id === "t1")!.strokeColor).toBe("#F8FAFC");
    // 비선택 요소는 그대로
    expect(out.find((e) => e.id === "r2")!.backgroundColor).toBeUndefined();
  });

  it("relabel은 선택 도형의 바운드 텍스트를 변경", () => {
    const out = applyEditOps(scene, sel, [{ op: "relabel", text: "변경됨" }]);
    expect(out.find((e) => e.id === "t1")!.text).toBe("변경됨");
  });

  it("emphasize는 강조 테두리", () => {
    const out = applyEditOps(scene, sel, [{ op: "emphasize" }]);
    const r1 = out.find((e) => e.id === "r1")!;
    expect(r1.strokeColor).toBe("#F59E0B");
    expect(r1.strokeWidth).toBe(4);
  });

  it("여러 op를 순서대로 적용", () => {
    const out = applyEditOps(scene, sel, [
      { op: "recolor", color: "#10B981" },
      { op: "opacity", value: 50 },
    ]);
    const r1 = out.find((e) => e.id === "r1")!;
    expect(r1.backgroundColor).toBe("#10B981");
    expect(r1.opacity).toBe(50);
  });
});

describe("parseEditResponse", () => {
  it("유효한 ops 파싱", () => {
    const ops = parseEditResponse({
      ops: [
        { op: "recolor", color: "#FF0000" },
        { op: "relabel", text: "안녕" },
      ],
    });
    expect(ops).toHaveLength(2);
  });
  it("잘못된 op/색은 거부", () => {
    expect(() => parseEditResponse({ ops: [{ op: "recolor", color: "red" }] })).toThrow();
    expect(() => parseEditResponse({ ops: [{ op: "nope" }] })).toThrow();
    expect(() => parseEditResponse({ ops: [] })).toThrow();
  });
});
