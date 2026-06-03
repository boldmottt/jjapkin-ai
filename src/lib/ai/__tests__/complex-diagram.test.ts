/**
 * 복잡한 다이어그램 생성 통합 테스트
 *
 * AI 호출 없이, 복잡한 DiagramIR을 실제 변환 파이프라인
 * (parseAIResponse + irToExcalidraw)에 통과시켜 장면 무결성을 검증한다.
 *   - 요소 수 (rect/text/arrow)
 *   - 컨테이너 바운드 텍스트 연결 (containerId ↔ boundElements)
 *   - 화살표 양끝 바인딩 (startBinding/endBinding → 실제 도형)
 *   - ID 고유성 / 멱등성 / 좌표 유효성(NaN 없음)
 */

import { describe, it, expect } from "vitest";
import { irToExcalidraw, type ExElement } from "@/lib/ai/ir-to-excalidraw";
import { parseAIResponse } from "@/lib/ai/parser";
import type { DiagramIR } from "@/types";

// ── 12노드, 분기 + 사이클이 있는 복잡한 플로우차트 ──
const complexFlow: DiagramIR = {
  diagramType: "flowchart",
  title: "주문 처리 (복잡)",
  nodes: [
    { id: "n1", label: "주문 시작", type: "start" },
    { id: "n2", label: "입력 검증", type: "decision" },
    { id: "n3", label: "재고 확인", type: "decision" },
    { id: "n4", label: "결제 처리", type: "process" },
    { id: "n5", label: "주문 확정", type: "process" },
    { id: "n6", label: "배송 준비", type: "process" },
    { id: "n7", label: "고객 알림", type: "process" },
    { id: "n8", label: "재입고 대기", type: "process" },
    { id: "n9", label: "오류 기록", type: "process" },
    { id: "n10", label: "환불 처리", type: "process" },
    { id: "n11", label: "완료", type: "end" },
    { id: "n12", label: "취소", type: "end" },
  ],
  edges: [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3", label: "유효" },
    { from: "n2", to: "n9", label: "오류" },
    { from: "n3", to: "n4", label: "재고 있음" },
    { from: "n3", to: "n8", label: "품절" },
    { from: "n4", to: "n5" },
    { from: "n5", to: "n6" },
    { from: "n6", to: "n7" },
    { from: "n7", to: "n11" },
    { from: "n8", to: "n3", label: "재입고" }, // 사이클(back edge)
    { from: "n9", to: "n10" },
    { from: "n10", to: "n12" },
  ],
};

interface SceneReport {
  total: number;
  rects: number;
  texts: number;
  arrows: number;
  boundTexts: number;
  boundArrows: number;
  danglingTextRefs: string[];
  danglingArrowRefs: string[];
  duplicateIds: string[];
  nanCoords: number;
}

function inspect(elements: ExElement[]): SceneReport {
  const ids = elements.map((e) => e.id);
  const rectIds = new Set(
    elements.filter((e) => e.type === "rectangle").map((e) => e.id),
  );

  const texts = elements.filter((e) => e.type === "text");
  const arrows = elements.filter((e) => e.type === "arrow");

  // 컨테이너 바운드 텍스트: containerId가 실제 rect를 가리키고,
  // 그 rect의 boundElements에 이 텍스트가 등록돼 있어야 함
  const danglingTextRefs: string[] = [];
  let boundTexts = 0;
  for (const t of texts) {
    const cid = (t as { containerId?: string | null }).containerId;
    if (!cid) continue;
    const container = elements.find((e) => e.id === cid);
    const registered =
      container?.boundElements?.some((b) => b.id === t.id && b.type === "text") ??
      false;
    if (rectIds.has(cid) && registered) boundTexts++;
    else danglingTextRefs.push(t.id);
  }

  // 화살표 양끝 바인딩이 실제 도형을 가리키는지
  const danglingArrowRefs: string[] = [];
  let boundArrows = 0;
  for (const a of arrows) {
    const s = a.startBinding?.elementId;
    const e = a.endBinding?.elementId;
    const okS = !s || rectIds.has(s);
    const okE = !e || rectIds.has(e);
    if (s && e && okS && okE) boundArrows++;
    if (!okS || !okE) danglingArrowRefs.push(a.id);
  }

  // 좌표 유효성
  let nanCoords = 0;
  for (const e of elements) {
    for (const v of [e.x, e.y, e.width, e.height]) {
      if (typeof v !== "number" || Number.isNaN(v)) nanCoords++;
    }
  }

  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) duplicateIds.push(id);
    seen.add(id);
  }

  return {
    total: elements.length,
    rects: rectIds.size,
    texts: texts.length,
    arrows: arrows.length,
    boundTexts,
    boundArrows,
    danglingTextRefs,
    danglingArrowRefs,
    duplicateIds: Array.from(new Set(duplicateIds)),
    nanCoords,
  };
}

describe("복잡한 다이어그램 생성", () => {
  it("12노드/12엣지 플로우차트 변환 무결성", () => {
    const elements = irToExcalidraw(complexFlow);
    const r = inspect(elements);

    // 리포트 출력
    // eslint-disable-next-line no-console
    console.log("[복잡 플로우차트] 리포트:", JSON.stringify(r, null, 2));

    expect(r.rects).toBe(12);
    expect(r.texts).toBe(12);
    expect(r.arrows).toBe(12);
    expect(r.total).toBe(36); // 12 + 12 + 12

    // 모든 텍스트가 컨테이너에 정상 바운드
    expect(r.boundTexts).toBe(12);
    expect(r.danglingTextRefs).toEqual([]);

    // 모든 화살표가 양끝 도형에 바운드 (dangling 없음)
    expect(r.danglingArrowRefs).toEqual([]);
    expect(r.boundArrows).toBe(12);

    // ID 고유 / 좌표 유효
    expect(r.duplicateIds).toEqual([]);
    expect(r.nanCoords).toBe(0);
  });

  it("동일 입력 → 동일 출력 (멱등성)", () => {
    const a = irToExcalidraw(complexFlow);
    const b = irToExcalidraw(complexFlow);
    expect(a).toEqual(b);
  });

  it("5종 레이아웃 모두 바인딩 무결성 유지", () => {
    const base = complexFlow.nodes.slice(0, 8);
    const types = ["flowchart", "mindmap", "process", "comparison", "list"] as const;
    for (const t of types) {
      const ir: DiagramIR = {
        diagramType: t,
        title: t,
        nodes: base,
        edges: complexFlow.edges.filter(
          (e) =>
            base.some((n) => n.id === e.from) && base.some((n) => n.id === e.to),
        ),
      };
      const r = inspect(irToExcalidraw(ir));
      // eslint-disable-next-line no-console
      console.log(`[${t}] rects=${r.rects} texts=${r.texts} arrows=${r.arrows} boundTexts=${r.boundTexts} danglingArrows=${r.danglingArrowRefs.length}`);
      expect(r.rects).toBe(8);
      expect(r.boundTexts).toBe(8);
      expect(r.danglingTextRefs).toEqual([]);
      expect(r.danglingArrowRefs).toEqual([]);
      expect(r.nanCoords).toBe(0);
    }
  });

  it("복잡한 3-후보 AI 응답 파싱 + 기본값 보정", () => {
    const aiJson = {
      candidates: [
        {
          id: "c1",
          diagramType: "flowchart",
          title: "후보 1",
          nodes: complexFlow.nodes, // type 일부만, color 없음
          edges: complexFlow.edges,
        },
        {
          id: "c2",
          diagramType: "mindmap",
          title: "후보 2",
          nodes: [
            { id: "m1", label: "루트" },
            { id: "m2", label: "자식1" },
            { id: "m3", label: "자식2" },
          ],
          edges: [
            { from: "m1", to: "m2" },
            { from: "m1", to: "m3" },
          ],
        },
        {
          id: "c3",
          diagramType: "process",
          title: "후보 3",
          nodes: [
            { id: "p1", label: "1단계" },
            { id: "p2", label: "2단계" },
          ],
          edges: [{ from: "p1", to: "p2" }],
        },
      ],
    };

    const candidates = parseAIResponse(aiJson);
    expect(candidates).toHaveLength(3);

    // 색상/타입 기본값 보정 확인
    for (const c of candidates) {
      for (const n of c.ir.nodes) {
        expect(n.type).toBeDefined();
        expect(n.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }

    // 각 후보가 실제로 장면으로 변환되는지 (end-to-end)
    for (const c of candidates) {
      const r = inspect(irToExcalidraw(c.ir));
      expect(r.duplicateIds).toEqual([]);
      expect(r.danglingTextRefs).toEqual([]);
    }
  });

  it("15노드 상한 초과 후보는 검증 실패", () => {
    const tooMany = {
      candidates: [
        {
          id: "c1",
          diagramType: "list",
          title: "초과",
          nodes: Array.from({ length: 16 }, (_, i) => ({
            id: `n${i}`,
            label: `항목 ${i}`,
          })),
          edges: [],
        },
      ],
    };
    expect(() => parseAIResponse(tooMany)).toThrow();
  });
});
