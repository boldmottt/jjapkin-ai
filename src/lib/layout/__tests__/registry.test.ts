import { describe, it, expect } from "vitest";
import { getLayout, registerLayout } from "@/lib/layout/registry";
import type { DiagramType } from "@/types";
import type { LayoutFn } from "@/lib/layout/types";

const nodes = [
  { id: "n1", label: "A" },
  { id: "n2", label: "B" },
  { id: "n3", label: "C" },
];
const edges = [{ from: "n1", to: "n2" }];

const TYPES: DiagramType[] = [
  "flowchart",
  "mindmap",
  "process",
  "comparison",
  "list",
];

describe("레이아웃 레지스트리", () => {
  it("5종 모두 등록되어 배치 결과를 반환", () => {
    for (const t of TYPES) {
      const positions = getLayout(t)(nodes, edges);
      expect(positions).toHaveLength(nodes.length);
      // 모든 위치가 유효한 좌표/식별자를 가짐
      for (const p of positions) {
        expect(typeof p.id).toBe("string");
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      }
      // 입력 노드와 1:1 대응
      expect(new Set(positions.map((p) => p.id))).toEqual(
        new Set(nodes.map((n) => n.id)),
      );
    }
  });

  it("미등록 타입은 빈 배열 폴백(과거 switch default 동작 보존)", () => {
    const fn = getLayout("____unknown____" as DiagramType);
    expect(fn(nodes, edges)).toEqual([]);
  });

  it("registerLayout으로 커스텀 엔진 추가 가능", () => {
    const custom: LayoutFn = (ns) =>
      ns.map((n, i) => ({
        id: n.id,
        label: n.label,
        type: "process",
        color: "#000000",
        x: i * 10,
        y: 0,
      }));
    registerLayout("__custom__", custom);
    const out = getLayout("__custom__" as DiagramType)(nodes, edges);
    expect(out.map((p) => p.x)).toEqual([0, 10, 20]);
  });
});
