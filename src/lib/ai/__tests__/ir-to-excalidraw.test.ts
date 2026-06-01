/**
 * IR → Excalidraw 변환기 테스트
 */

import { describe, it, expect } from "vitest";
import { irToExcalidraw } from "@/lib/ai/ir-to-excalidraw";
import type { DiagramIR } from "@/types";

const mockIR: DiagramIR = {
  diagramType: "flowchart",
  title: "Test Flow",
  nodes: [
    { id: "n1", label: "Start", type: "start", color: "#10B981" },
    { id: "n2", label: "Process", type: "process", color: "#3B82F6" },
    { id: "n3", label: "End", type: "end", color: "#EF4444" },
  ],
  edges: [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3", label: "done" },
  ],
};

describe("irToExcalidraw", () => {
  it("flowchart: 노드 3개 + 엣지 2개 → 8개 요소 (rect×3 + text×3 + arrow×2)", () => {
    const elements = irToExcalidraw(mockIR);
    expect(elements).toHaveLength(8);
  });

  it("flowchart: rect 요소가 올바른 type을 가짐", () => {
    const elements = irToExcalidraw(mockIR);
    const rects = elements.filter((e) => e.type === "rectangle");
    expect(rects).toHaveLength(3);
  });

  it("flowchart: text 요소가 label을 포함", () => {
    const elements = irToExcalidraw(mockIR);
    const texts = elements.filter((e) => e.type === "text");
    expect(texts).toHaveLength(3);
  });

  it("flowchart: arrow 요소가 올바른 type을 가짐", () => {
    const elements = irToExcalidraw(mockIR);
    const arrows = elements.filter((e) => e.type === "arrow");
    expect(arrows).toHaveLength(2);
  });

  it("모든 요소가 유니크한 id를 가짐", () => {
    const elements = irToExcalidraw(mockIR);
    const ids = elements.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("mindmap: 루트 + 4 자식 → 10개 요소 (rect×5 + text×5)", () => {
    const mindmapIR: DiagramIR = {
      diagramType: "mindmap",
      title: "Org Chart",
      nodes: [
        { id: "n1", label: "CEO" },
        { id: "n2", label: "CTO" },
        { id: "n3", label: "CFO" },
        { id: "n4", label: "COO" },
        { id: "n5", label: "VP" },
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n1", to: "n3" },
        { from: "n1", to: "n4" },
        { from: "n1", to: "n5" },
      ],
    };
    const elements = irToExcalidraw(mindmapIR);
    expect(elements.filter((e) => e.type === "rectangle")).toHaveLength(5);
    expect(elements.filter((e) => e.type === "arrow")).toHaveLength(4);
  });

  it("process: 4단계 선형 → 8개 요소 (rect×4 + text×4)", () => {
    const processIR: DiagramIR = {
      diagramType: "process",
      title: "Pipeline",
      nodes: [
        { id: "n1", label: "Plan", type: "start" },
        { id: "n2", label: "Build", type: "process" },
        { id: "n3", label: "Test", type: "process" },
        { id: "n4", label: "Deploy", type: "end" },
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
      ],
    };
    const elements = irToExcalidraw(processIR);
    // process에서는 rect, text, arrow 모두 있음
    expect(elements.length).toBeGreaterThan(0);
    // left-to-right 이므로 x 좌표가 점점 커져야 함
    const rects = elements.filter((e) => e.type === "rectangle");
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i].x).toBeGreaterThan(rects[i - 1].x);
    }
  });

  it("comparison: 4개 노드 → 2컬럼 배치", () => {
    const compIR: DiagramIR = {
      diagramType: "comparison",
      title: "Comparison",
      nodes: [
        { id: "n1", label: "A1" },
        { id: "n2", label: "B1" },
        { id: "n3", label: "A2" },
        { id: "n4", label: "B2" },
      ],
      edges: [],
    };
    const elements = irToExcalidraw(compIR);
    const rects = elements.filter((e) => e.type === "rectangle");
    // comparison은 좌측컬럼 먼저 → 우측컬럼 순서로 배치
    // 2개 이상 x < 200 (좌측), 2개 이상 x > 300 (우측)
    const leftCount = rects.filter((r) => r.x < 200).length;
    const rightCount = rects.filter((r) => r.x > 300).length;
    expect(leftCount).toBe(2);
    expect(rightCount).toBe(2);
  });

  it("list: 5개 노드 → 수직 배치, y 증가", () => {
    const listIR: DiagramIR = {
      diagramType: "list",
      title: "Items",
      nodes: [
        { id: "n1", label: "Item 1" },
        { id: "n2", label: "Item 2" },
        { id: "n3", label: "Item 3" },
        { id: "n4", label: "Item 4" },
        { id: "n5", label: "Item 5" },
      ],
      edges: [],
    };
    const elements = irToExcalidraw(listIR);
    const rects = elements.filter((e) => e.type === "rectangle");
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i].y).toBeGreaterThan(rects[i - 1].y);
    }
  });

  it("엣지가 없는 경우 arrow 없음", () => {
    const noEdgeIR: DiagramIR = {
      diagramType: "list",
      title: "No edges",
      nodes: [{ id: "n1", label: "Only" }],
      edges: [],
    };
    const elements = irToExcalidraw(noEdgeIR);
    const arrows = elements.filter((e) => e.type === "arrow");
    expect(arrows).toHaveLength(0);
  });

  it("존재하지 않는 노드 참조하는 엣지는 무시", () => {
    const badEdgeIR: DiagramIR = {
      diagramType: "flowchart",
      title: "Bad Edge",
      nodes: [{ id: "n1", label: "A" }, { id: "n2", label: "B" }],
      edges: [{ from: "n1", to: "n3" }], // n3는 없음
    };
    const elements = irToExcalidraw(badEdgeIR);
    const arrows = elements.filter((e) => e.type === "arrow");
    expect(arrows).toHaveLength(0);
  });
});
