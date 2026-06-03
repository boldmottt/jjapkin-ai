/**
 * 프로세스 레이아웃: 좌→우 선형 배치.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { NODE_W, NODE_H, H_GAP, START_X } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

export const processLayout: LayoutFn = (nodes) => {
  const positions: NodePosition[] = [];
  let x = START_X;
  const y = 300 - NODE_H / 2;

  for (const node of nodes) {
    positions.push({
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
      x,
      y,
    });
    x += NODE_W + H_GAP;
  }

  return positions;
};
