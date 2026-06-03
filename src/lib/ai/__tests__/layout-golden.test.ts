/**
 * 레이아웃 골든 스냅샷
 *
 * F4(레이아웃 레지스트리 리팩터)의 안전망. 리팩터 전 현재 irToExcalidraw
 * 출력을 스냅샷으로 박제하고, 리팩터 후에도 바이트 동일함을 보장한다.
 * 5종 레이아웃 전부 + 분기/사이클 플로우차트를 커버한다.
 */

import { describe, it, expect } from "vitest";
import { irToExcalidraw } from "@/lib/ai/ir-to-excalidraw";
import type { DiagramIR, DiagramType } from "@/types";

const nodes4 = [
  { id: "n1", label: "노드 1", type: "start" as const },
  { id: "n2", label: "노드 2", type: "process" as const },
  { id: "n3", label: "노드 3", type: "decision" as const },
  { id: "n4", label: "노드 4", type: "end" as const },
];

const edges3 = [
  { from: "n1", to: "n2" },
  { from: "n2", to: "n3", label: "예" },
  { from: "n3", to: "n4" },
];

function ir(diagramType: DiagramType): DiagramIR {
  return { diagramType, title: `${diagramType} 테스트`, nodes: nodes4, edges: edges3 };
}

const TYPES: DiagramType[] = [
  "flowchart",
  "mindmap",
  "process",
  "comparison",
  "list",
  "timeline",
];

describe("레이아웃 골든 스냅샷", () => {
  for (const t of TYPES) {
    it(`${t} 출력 고정`, () => {
      expect(irToExcalidraw(ir(t))).toMatchSnapshot();
    });
  }

  it("분기+사이클 플로우차트 출력 고정", () => {
    const branchy: DiagramIR = {
      diagramType: "flowchart",
      title: "분기/사이클",
      nodes: [
        { id: "a", label: "A", type: "start" },
        { id: "b", label: "B", type: "decision" },
        { id: "c", label: "C", type: "process" },
        { id: "d", label: "D", type: "process" },
        { id: "e", label: "E", type: "end" },
      ],
      edges: [
        { from: "a", to: "b" },
        { from: "b", to: "c", label: "예" },
        { from: "b", to: "d", label: "아니오" },
        { from: "c", to: "e" },
        { from: "d", to: "b", label: "재시도" }, // 사이클
      ],
    };
    expect(irToExcalidraw(branchy)).toMatchSnapshot();
  });
});
