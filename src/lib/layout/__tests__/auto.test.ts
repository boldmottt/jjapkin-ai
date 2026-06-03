import { describe, it, expect } from "vitest";
import { makeAutoLayout } from "@/lib/layout/engines/auto";
import { measureNodeSize } from "@/lib/layout/measure";

describe("measureNodeSize", () => {
  it("긴 라벨일수록 넓거나 줄이 늘어남", () => {
    const a = measureNodeSize("짧음");
    const b = measureNodeSize(
      "아주 긴 라벨 텍스트가 들어가는 경우의 노드 크기 측정",
    );
    expect(b.w).toBeGreaterThanOrEqual(a.w);
    expect(b.w * b.lines).toBeGreaterThan(a.w * a.lines);
  });
  it("최소 크기 보장", () => {
    const s = measureNodeSize("a");
    expect(s.w).toBeGreaterThanOrEqual(120);
    expect(s.h).toBeGreaterThanOrEqual(60);
  });
});

describe("자동 레이아웃(dagre)", () => {
  const nodes = [
    { id: "n1", label: "시작" },
    { id: "n2", label: "처리" },
    { id: "n3", label: "끝" },
  ];
  const edges = [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3" },
  ];

  it("TB: 노드 수만큼 위치 + 좌표 유효 + 겹침 없음", () => {
    const out = makeAutoLayout({ rankdir: "TB" })(nodes, edges);
    expect(out).toHaveLength(3);
    for (const p of out) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(p.w).toBeGreaterThan(0);
      expect(p.h).toBeGreaterThan(0);
    }
    // 사각형 겹침 없음(쌍별 AABB 비분리)
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        const overlap =
          a.x < b.x + b.w! &&
          a.x + a.w! > b.x &&
          a.y < b.y + b.h! &&
          a.y + a.h! > b.y;
        expect(overlap).toBe(false);
      }
    }
  });

  it("LR: 순차 엣지면 x가 증가", () => {
    const out = makeAutoLayout({ rankdir: "LR" })(nodes, edges);
    const byId = new Map(out.map((p) => [p.id, p]));
    expect(byId.get("n2")!.x).toBeGreaterThan(byId.get("n1")!.x);
    expect(byId.get("n3")!.x).toBeGreaterThan(byId.get("n2")!.x);
  });

  it("빈 입력은 빈 배열", () => {
    expect(makeAutoLayout()([], [])).toEqual([]);
  });
});
