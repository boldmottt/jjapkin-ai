/**
 * 리스트 레이아웃: 세로 나열, 교차 배경색.
 */
import { NODE_H, V_GAP, START_Y } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

export const listLayout: LayoutFn = (nodes) => {
  const positions: NodePosition[] = [];
  let y = START_Y;
  const x = 250;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    positions.push({
      id: node.id,
      label: node.label,
      type: "process",
      color: node.color ?? (i % 2 === 0 ? "#F3F4F6" : "#E5E7EB"),
      x,
      y,
    });
    y += NODE_H + V_GAP;
  }

  return positions;
};
