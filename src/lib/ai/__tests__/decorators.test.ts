import { describe, it, expect } from "vitest";
import { irToExcalidraw } from "@/lib/ai/ir-to-excalidraw";
import type { DiagramIR } from "@/types";

describe("엣지 라벨", () => {
  it("라벨 있는 엣지만 독립 텍스트로 렌더", () => {
    const ir: DiagramIR = {
      diagramType: "flowchart",
      title: "라벨",
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ],
      edges: [
        { from: "a", to: "b", label: "예" },
        { from: "b", to: "c" }, // 라벨 없음
      ],
    };
    const els = irToExcalidraw(ir);
    const texts = els.filter((e) => e.type === "text");
    // 노드 텍스트 3 + 라벨 텍스트 1 = 4
    expect(texts).toHaveLength(4);
    const labelText = texts.find((t) => t.text === "예");
    expect(labelText).toBeDefined();
    // 엣지 라벨은 컨테이너 비바운드(독립)
    expect((labelText as { containerId?: unknown }).containerId).toBeNull();
  });
});

describe("강조 데코레이터", () => {
  const base: DiagramIR = {
    diagramType: "list",
    title: "강조",
    nodes: [
      { id: "a", label: "보통" },
      { id: "b", label: "강조", emphasis: "highlight" },
      { id: "c", label: "배지", emphasis: "badge" },
    ],
    edges: [],
  };

  it("highlight는 도형 테두리를 강조색/두껍게", () => {
    const els = irToExcalidraw(base);
    const rects = els.filter((e) => e.type === "rectangle");
    // 노드 순서대로 a,b,c → 두 번째가 highlight
    const b = rects[1];
    expect(b.strokeColor).toBe("#F59E0B");
    expect(b.strokeWidth).toBe(4);
  });

  it("badge는 추가 ellipse(배지)를 생성", () => {
    const els = irToExcalidraw(base);
    const badges = els.filter((e) => e.type === "ellipse");
    expect(badges).toHaveLength(1);
    expect(badges[0].backgroundColor).toBe("#F59E0B");
  });

  it("emphasis 없으면 도형 변화 없음(기본 테두리)", () => {
    const els = irToExcalidraw(base);
    const a = els.filter((e) => e.type === "rectangle")[0];
    expect(a.strokeColor).toBe("#1F2937");
  });
});
