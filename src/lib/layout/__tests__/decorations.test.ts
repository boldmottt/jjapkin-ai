import { describe, it, expect } from "vitest";
import { irToExcalidraw } from "@/lib/ai/ir-to-excalidraw";
import type { DiagramIR } from "@/types";

describe("타입별 장식", () => {
  it("타임라인은 중심선(line)을 배경에 추가", () => {
    const ir: DiagramIR = {
      diagramType: "timeline",
      title: "연혁",
      nodes: [
        { id: "n1", label: "2020 설립" },
        { id: "n2", label: "2022 확장" },
        { id: "n3", label: "2024 상장" },
      ],
      edges: [],
    };
    const els = irToExcalidraw(ir);
    const lines = els.filter((e) => e.type === "line");
    expect(lines).toHaveLength(1);
    // 배경(맨 앞 인덱스)에 깔림
    expect(els[0].type).toBe("line");
  });

  it("막대차트는 기준선 + value 라벨을 추가", () => {
    const ir: DiagramIR = {
      diagramType: "bar-chart",
      title: "매출",
      nodes: [
        { id: "n1", label: "1분기", value: 30 },
        { id: "n2", label: "2분기", value: 50 },
        { id: "n3", label: "3분기", value: 20 },
      ],
      edges: [],
    };
    const els = irToExcalidraw(ir);
    expect(els.filter((e) => e.type === "line")).toHaveLength(1); // 기준선
    // 값 라벨 텍스트(독립, containerId 없음) 3개
    const valueLabels = els.filter(
      (e) =>
        e.type === "text" &&
        (e as { containerId?: unknown }).containerId == null &&
        ["30", "50", "20"].includes(String(e.text)),
    );
    expect(valueLabels).toHaveLength(3);
  });

  it("벤다이어그램 원은 반투명(opacity<100)", () => {
    const ir: DiagramIR = {
      diagramType: "venn",
      title: "교집합",
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      edges: [],
    };
    const els = irToExcalidraw(ir);
    const ellipses = els.filter((e) => e.type === "ellipse");
    expect(ellipses.length).toBeGreaterThan(0);
    for (const el of ellipses) {
      expect((el as { opacity?: number }).opacity).toBeLessThan(100);
    }
  });
});
