/**
 * 타임라인 레이아웃: 좌→우 가로 배치, 노드를 중심선 위/아래로 번갈아 배치.
 * 순차 엣지는 어댑터가 화살표로 렌더링한다.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { NODE_W, NODE_H, H_GAP, START_X } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

export const timelineLayout: LayoutFn = (nodes) => {
  const positions: NodePosition[] = [];
  const centerY = 280;
  const offset = NODE_H / 2 + 40; // 중심선에서 위/아래로 떨어진 거리

  let x = START_X;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const above = i % 2 === 0;
    positions.push({
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
      x,
      y: above ? centerY - offset - NODE_H : centerY + offset,
    });
    x += NODE_W + H_GAP;
  }

  return positions;
};
