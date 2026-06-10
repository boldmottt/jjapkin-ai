/**
 * 마인드맵 레이아웃: 루트를 중앙에, 자식들을 깊이별 동심원(ring)으로 배치.
 *
 * - 깊이는 엣지 기반 BFS로 계산 → 손자 노드가 부모와 같은 링에 섞이지 않는다.
 * - 링 반경은 그 링의 노드 수·폭에 맞춰 커져 노드 겹침을 막는다.
 * - 자식은 부모의 각도 근처에 배치해 연결선 교차를 줄인다.
 */
import { measureNodeSize } from "../measure";
import type { LayoutFn, NodePosition } from "../types";

const CX = 400;
const CY = 300;
const BASE_RADIUS = 200;
const RING_GAP = 170;

export const mindmapLayout: LayoutFn = (nodes, edges) => {
  if (nodes.length === 0) return [];

  // BFS로 루트(첫 노드) 기준 깊이 계산. 엣지로 닿지 않는 노드는 깊이 1로 취급.
  const childrenOf = new Map<string, string[]>();
  for (const e of edges) {
    childrenOf.set(e.from, [...(childrenOf.get(e.from) ?? []), e.to]);
  }
  const root = nodes[0];
  const depth = new Map<string, number>([[root.id, 0]]);
  const queue = [root.id];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const child of childrenOf.get(cur) ?? []) {
      if (!depth.has(child)) {
        depth.set(child, depth.get(cur)! + 1);
        queue.push(child);
      }
    }
  }

  const positions: NodePosition[] = [];
  const angleOf = new Map<string, number>(); // 자식 배치 시 부모 각도 참조

  const rootSize = measureNodeSize(root.label);
  positions.push({
    id: root.id,
    label: root.label,
    type: "start",
    color: root.color ?? "#1E40AF",
    x: CX - rootSize.w / 2,
    y: CY - rootSize.h / 2,
    w: rootSize.w,
    h: rootSize.h,
  });

  // 링(깊이)별로 묶기. 도달 불가 노드는 깊이 1 링에 합류.
  const rings = new Map<number, typeof nodes>();
  for (const n of nodes.slice(1)) {
    const d = depth.get(n.id) ?? 1;
    rings.set(d, [...(rings.get(d) ?? []), n]);
  }

  const sortedRings = Array.from(rings.entries()).sort(([a], [b]) => a - b);
  for (const [d, ring] of sortedRings) {
    // 둘레가 노드 폭 합 + 여백을 담을 만큼 반경을 키움(겹침 방지)
    const totalW = ring.reduce(
      (sum, n) => sum + measureNodeSize(n.label).w + 60,
      0,
    );
    const radius = Math.max(
      BASE_RADIUS + (d - 1) * RING_GAP,
      totalW / (2 * Math.PI),
    );

    const parentAngle = (id: string): number => {
      const parent = edges.find((e) => e.to === id)?.from;
      return parent !== undefined ? (angleOf.get(parent) ?? 0) : 0;
    };

    // 1차 링: 360° 균등 분포. 2차 이상: 부모 각도 주변에 형제끼리 묶어
    // 배치 → 가지가 부모 방향으로 뻗고 연결선이 반대편을 가로지르지 않는다.
    const step = (2 * Math.PI) / ring.length;
    const siblingIdx = new Map<string, number>(); // 부모별 형제 순번
    ring.forEach((node, i) => {
      let angle: number;
      if (d === 1) {
        angle = -Math.PI / 2 + step * i;
      } else {
        const parent = edges.find((e) => e.to === node.id)?.from ?? "";
        const sib = siblingIdx.get(parent) ?? 0;
        siblingIdx.set(parent, sib + 1);
        const count = ring.filter(
          (n) => (edges.find((e) => e.to === n.id)?.from ?? "") === parent,
        ).length;
        // 형제들을 부모 각도 중심으로 부채꼴 배치.
        // 간격은 호 길이가 노드 폭(최대 280)+여백을 넘도록 반경에 반비례.
        const spread = 320 / radius;
        angle = parentAngle(node.id) + (sib - (count - 1) / 2) * spread;
      }
      angleOf.set(node.id, angle);
      const { w, h } = measureNodeSize(node.label);
      positions.push({
        id: node.id,
        label: node.label,
        type: "process",
        color: node.color ?? (d === 1 ? "#3B82F6" : "#93C5FD"),
        x: CX + radius * Math.cos(angle) - w / 2,
        y: CY + radius * Math.sin(angle) - h / 2,
        w,
        h,
      });
    });
  }

  return positions;
};
