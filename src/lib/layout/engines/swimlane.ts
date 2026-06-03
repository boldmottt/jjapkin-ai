/**
 * 스윔레인 레이아웃: 노드를 group(레인)별 가로 행으로 배치.
 * 같은 레인 노드는 좌→우 순서대로. group이 없으면 node.type을 레인으로 사용.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { NODE_W, NODE_H, H_GAP, V_GAP, START_X, START_Y } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

export const swimlaneLayout: LayoutFn = (nodes) => {
  // 레인 키 = group ?? type ?? "default", 첫 등장 순서로 레인 행 결정
  const laneOrder: string[] = [];
  const laneIndex = new Map<string, number>();
  const laneFill = new Map<string, number>(); // 레인별 다음 열 인덱스

  const laneKey = (n: (typeof nodes)[number]) =>
    n.group ?? n.type ?? "default";

  for (const n of nodes) {
    const k = laneKey(n);
    if (!laneIndex.has(k)) {
      laneIndex.set(k, laneOrder.length);
      laneOrder.push(k);
    }
  }

  return nodes.map((node): NodePosition => {
    const k = laneKey(node);
    const lane = laneIndex.get(k)!;
    const col = laneFill.get(k) ?? 0;
    laneFill.set(k, col + 1);
    return {
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
      x: START_X + col * (NODE_W + H_GAP),
      y: START_Y + lane * (NODE_H + V_GAP),
    };
  });
};
