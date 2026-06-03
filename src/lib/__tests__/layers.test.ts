import { describe, it, expect } from "vitest";
import {
  buildLayers,
  setLayerHidden,
  setLayerLocked,
  reorderLayer,
  type SceneEl,
} from "@/lib/layers";

const scene: SceneEl[] = [
  { id: "r1", type: "rectangle" },
  { id: "t1", type: "text", containerId: "r1", text: "시작" },
  { id: "r2", type: "rectangle" },
  { id: "t2", type: "text", containerId: "r2", text: "끝" },
  { id: "a1", type: "arrow" },
];

describe("buildLayers", () => {
  it("바인딩 텍스트를 컨테이너에 흡수하고 화살표는 별도 항목", () => {
    const layers = buildLayers(scene);
    expect(layers).toHaveLength(3); // r1, r2, a1
  });

  it("컨테이너 항목의 elementIds에 바인딩 텍스트가 포함되고 라벨은 텍스트", () => {
    const layers = buildLayers(scene);
    const r1 = layers.find((l) => l.key === "r1")!;
    expect(r1.elementIds.sort()).toEqual(["r1", "t1"]);
    expect(r1.label).toBe("시작");
  });

  it("앞 레이어(배열 뒤)가 패널 위로 오도록 역순", () => {
    const layers = buildLayers(scene);
    expect(layers[0].key).toBe("a1"); // 배열 마지막 = 맨 앞 = 패널 최상단
  });

  it("같은 groupId 요소는 한 항목으로 묶임", () => {
    const grouped: SceneEl[] = [
      { id: "g1", type: "rectangle", groupIds: ["G"] },
      { id: "g2", type: "ellipse", groupIds: ["G"] },
    ];
    const layers = buildLayers(grouped);
    expect(layers).toHaveLength(1);
    expect(layers[0].elementIds.sort()).toEqual(["g1", "g2"]);
  });

  it("opacity 0이면 hidden, locked면 locked", () => {
    const layers = buildLayers([
      { id: "x", type: "rectangle", opacity: 0, locked: true },
    ]);
    expect(layers[0].hidden).toBe(true);
    expect(layers[0].locked).toBe(true);
  });

  it("isDeleted 요소는 제외", () => {
    const layers = buildLayers([
      { id: "x", type: "rectangle" },
      { id: "y", type: "rectangle", isDeleted: true },
    ]);
    expect(layers).toHaveLength(1);
  });
});

describe("setLayerHidden / setLayerLocked", () => {
  it("항목의 모든 요소에 opacity를 적용", () => {
    const layers = buildLayers(scene);
    const r1 = layers.find((l) => l.key === "r1")!;
    const next = setLayerHidden(scene, r1, true);
    expect(next.find((e) => e.id === "r1")!.opacity).toBe(0);
    expect(next.find((e) => e.id === "t1")!.opacity).toBe(0);
    expect(next.find((e) => e.id === "a1")!.opacity).toBeUndefined();
  });

  it("항목의 모든 요소에 locked를 적용", () => {
    const layers = buildLayers(scene);
    const r1 = layers.find((l) => l.key === "r1")!;
    const next = setLayerLocked(scene, r1, true);
    expect(next.find((e) => e.id === "r1")!.locked).toBe(true);
    expect(next.find((e) => e.id === "t1")!.locked).toBe(true);
  });
});

describe("reorderLayer", () => {
  it("모든 요소를 보존하며 z-order를 변경", () => {
    const layers = buildLayers(scene); // 패널: [a1, r2, r1]
    const next = reorderLayer(scene, layers, "a1", "down"); // 맨 앞을 뒤로
    expect(next.map((e) => e.id).sort()).toEqual(["a1", "r1", "t1", "r2", "t2"].sort());
    // a1이 한 단계 뒤로 → 배열에서 r2 블록보다 앞쪽으로 이동
    const ids = next.map((e) => e.id);
    expect(ids.indexOf("a1")).toBeLessThan(ids.indexOf("r2"));
  });

  it("경계에서는 변화 없음", () => {
    const layers = buildLayers(scene);
    const next = reorderLayer(scene, layers, "a1", "up"); // 이미 최상단
    expect(next.map((e) => e.id)).toEqual(scene.map((e) => e.id));
  });
});
