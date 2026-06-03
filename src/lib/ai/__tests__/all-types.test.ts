/**
 * 전체 다이어그램 타입 구조 무결성 테스트
 *
 * 등록된 모든 DIAGRAM_TYPES를 어댑터(irToExcalidraw)에 통과시켜
 * 장면이 깨지지 않는지 검증한다(도형/바운드텍스트/좌표 유효성/ID 고유).
 */
import { describe, it, expect } from "vitest";
import { irToExcalidraw } from "@/lib/ai/ir-to-excalidraw";
import { DIAGRAM_TYPES } from "@/types";
import type { DiagramIR } from "@/types";

const SHAPES = new Set(["rectangle", "ellipse", "diamond"]);

function makeIR(diagramType: DiagramIR["diagramType"]): DiagramIR {
  return {
    diagramType,
    title: `${diagramType} 통합`,
    nodes: [
      { id: "n1", label: "항목 하나", type: "start", group: "A", value: 10 },
      { id: "n2", label: "항목 둘", type: "process", group: "A", value: 7 },
      { id: "n3", label: "항목 셋", type: "process", group: "B", value: 4 },
      { id: "n4", label: "항목 넷", type: "end", group: "B", value: 2 },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  };
}

describe("전체 타입 구조 무결성", () => {
  for (const t of DIAGRAM_TYPES) {
    it(`${t}: 도형/바운드텍스트/좌표/ID 무결`, () => {
      const els = irToExcalidraw(makeIR(t));
      expect(els.length).toBeGreaterThan(0);

      const ids = els.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length); // ID 고유

      const shapeIds = new Set(
        els.filter((e) => SHAPES.has(String(e.type))).map((e) => e.id),
      );
      const texts = els.filter((e) => e.type === "text");
      // 노드 4개 → 도형 4개 + 텍스트 4개 (엣지 화살표는 타입마다 다름)
      expect(shapeIds.size).toBe(4);
      expect(texts.length).toBe(4);

      // 모든 텍스트가 실제 도형에 바운드
      for (const tx of texts) {
        const cid = (tx as { containerId?: string | null }).containerId;
        expect(typeof cid).toBe("string");
        expect(shapeIds.has(cid as string)).toBe(true);
      }

      // 좌표 유효(NaN 없음)
      for (const e of els) {
        for (const v of [e.x, e.y, e.width, e.height]) {
          expect(typeof v).toBe("number");
          expect(Number.isNaN(v as number)).toBe(false);
        }
      }
    });
  }
});
