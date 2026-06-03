import { describe, it, expect } from "vitest";
import { irToExcalidraw, irToExcalidrawWithFiles } from "@/lib/ai/ir-to-excalidraw";
import type { DiagramIR } from "@/types";

const ir: DiagramIR = {
  diagramType: "card-grid",
  title: "아이콘 테스트",
  nodes: [
    { id: "n1", label: "로켓", icon: "lucide:rocket" },
    { id: "n2", label: "결제", icon: "credit-card" },
    { id: "n3", label: "아이콘 없음" },
    { id: "n4", label: "잘못된 아이콘", icon: "__no_such_icon__" },
  ],
  edges: [],
};

describe("아이콘 변환", () => {
  it("icon 있는 노드만 image 요소 + files 생성", () => {
    const { elements, files } = irToExcalidrawWithFiles(ir);
    const images = elements.filter((e) => e.type === "image");
    // n1(rocket), n2(credit-card)만 유효 → 2개. n3 없음, n4 무효.
    expect(images).toHaveLength(2);
    expect(Object.keys(files).sort()).toEqual([
      "iconfile_n1",
      "iconfile_n2",
    ]);
    // 모든 image의 fileId가 실제 files를 가리킴
    for (const img of images) {
      const fid = (img as { fileId?: string }).fileId!;
      expect(files[fid]).toBeDefined();
      expect(files[fid].dataURL).toMatch(/^data:image\/svg\+xml/);
    }
  });

  it("기본 irToExcalidraw는 아이콘 없이 동작(하위호환)", () => {
    const els = irToExcalidraw(ir);
    expect(els.some((e) => e.type === "image")).toBe(false);
  });

  it("결정적: 동일 IR → 동일 files (재생성 안정)", () => {
    const a = irToExcalidrawWithFiles(ir);
    const b = irToExcalidrawWithFiles(ir);
    expect(a.files).toEqual(b.files);
    expect(a.elements).toEqual(b.elements);
  });
});
