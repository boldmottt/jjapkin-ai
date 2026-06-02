import { describe, it, expect } from "vitest";
import {
  boundingBox,
  applyProps,
  flipElements,
  alignElements,
  asHex,
  radToDeg,
  degToRad,
  type PropEl,
} from "@/lib/element-props";

const els: PropEl[] = [
  { id: "a", x: 0, y: 0, width: 100, height: 50 },
  { id: "b", x: 200, y: 100, width: 50, height: 50 },
];
const idsAB = new Set(["a", "b"]);

describe("boundingBox", () => {
  it("선택 영역을 계산", () => {
    expect(boundingBox(els)).toEqual({ minX: 0, minY: 0, maxX: 250, maxY: 150 });
  });
});

describe("applyProps", () => {
  it("선택 요소에만 패치 병합", () => {
    const next = applyProps(els, new Set(["a"]), { backgroundColor: "#fff" });
    expect(next[0].backgroundColor).toBe("#fff");
    expect(next[1].backgroundColor).toBeUndefined();
  });
});

describe("alignElements", () => {
  it("좌측 정렬은 모든 x를 minX로", () => {
    const next = alignElements(els, idsAB, "left");
    expect(next.every((e) => e.x === 0)).toBe(true);
  });
  it("우측 정렬은 오른쪽 변을 maxX에 맞춤", () => {
    const next = alignElements(els, idsAB, "right");
    expect(next.find((e) => e.id === "a")!.x).toBe(150); // 250 - 100
    expect(next.find((e) => e.id === "b")!.x).toBe(200); // 250 - 50
  });
  it("중간(세로) 정렬", () => {
    const next = alignElements(els, idsAB, "middle");
    // bbox 세로 중심 = 75, a 높이 50 → y = 50
    expect(next.find((e) => e.id === "a")!.y).toBe(50);
  });
});

describe("flipElements", () => {
  it("가로 뒤집기는 bbox 기준으로 x를 반사", () => {
    const next = flipElements(els, idsAB, "horizontal");
    // a: minX+maxX-(x+w) = 0+250-100 = 150
    expect(next.find((e) => e.id === "a")!.x).toBe(150);
    // b: 250-(250) = 0
    expect(next.find((e) => e.id === "b")!.x).toBe(0);
  });

  it("각도를 반전하고 points를 미러", () => {
    const lin: PropEl[] = [
      { id: "l", x: 0, y: 0, width: 100, height: 0, angle: 0.5, points: [[0, 0], [100, 0]] },
    ];
    const next = flipElements(lin, new Set(["l"]), "horizontal");
    expect(next[0].angle).toBe(-0.5);
    expect(next[0].points).toEqual([[100, 0], [0, 0]]);
  });

  it("선택 안 된 요소는 그대로", () => {
    const next = flipElements(els, new Set(["a"]), "horizontal");
    expect(next.find((e) => e.id === "b")!.x).toBe(200);
  });
});

describe("asHex / 각도 변환", () => {
  it("유효 hex만 통과, 아니면 fallback", () => {
    expect(asHex("#aabbcc", "#000")).toBe("#aabbcc");
    expect(asHex("transparent", "#000")).toBe("#000");
    expect(asHex(undefined, "#123456")).toBe("#123456");
  });
  it("rad↔deg 변환", () => {
    expect(radToDeg(Math.PI)).toBe(180);
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });
});
