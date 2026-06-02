import { describe, it, expect } from "vitest";
import {
  boundingBox,
  applyProps,
  flipElements,
  alignElements,
  distributeElements,
  createShadows,
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

describe("distributeElements", () => {
  it("3개를 균등 간격으로 분배 (첫·끝 고정)", () => {
    const three: PropEl[] = [
      { id: "a", x: 0, y: 0, width: 10, height: 10 },
      { id: "b", x: 30, y: 0, width: 10, height: 10 },
      { id: "c", x: 100, y: 0, width: 10, height: 10 },
    ];
    const ids = new Set(["a", "b", "c"]);
    const next = distributeElements(three, ids, "horizontal");
    // span=110, totalSize=30, gap=(110-30)/2=40 → a:0, b:50, c:100
    expect(next.find((e) => e.id === "a")!.x).toBe(0);
    expect(next.find((e) => e.id === "b")!.x).toBe(50);
    expect(next.find((e) => e.id === "c")!.x).toBe(100);
  });

  it("3개 미만이면 변화 없음", () => {
    const next = distributeElements(els, idsAB, "horizontal");
    expect(next).toEqual(els);
  });
});

describe("createShadows", () => {
  it("선택 도형마다 그림자 복제본을 원본 앞에 삽입", () => {
    const one: PropEl[] = [{ id: "r", type: "rectangle", x: 10, y: 20, width: 50, height: 50 }];
    let n = 0;
    const next = createShadows(one, new Set(["r"]), {
      dx: 6,
      dy: 6,
      idGen: () => `s${n++}`,
    });
    expect(next).toHaveLength(2);
    expect(next[0].id).toBe("s0"); // 그림자가 먼저(뒤 레이어)
    expect(next[1].id).toBe("r");
    expect(next[0].x).toBe(16);
    expect(next[0].y).toBe(26);
    expect(next[0].opacity).toBe(40);
  });

  it("텍스트 등 그림자 비대상은 복제 안 함", () => {
    const t: PropEl[] = [{ id: "t", type: "text", x: 0, y: 0, width: 10, height: 10 }];
    const next = createShadows(t, new Set(["t"]));
    expect(next).toHaveLength(1);
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
