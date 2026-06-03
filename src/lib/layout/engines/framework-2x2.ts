/**
 * 2x2 프레임워크 레이아웃: 사분면 매트릭스(예: 중요도/긴급도, BCG 매트릭스).
 * 앞 4개 노드를 사분면에 배치, 초과분은 아래 행에 그리드로 이어 붙인다.
 */
import { START_X, START_Y } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

const CELL_W = 220;
const CELL_H = 140;
const GAP = 16;

// 사분면 색(좌상→우상→좌하→우하)
const QUADRANT_COLORS = ["#DBEAFE", "#DCFCE7", "#FEF9C3", "#FEE2E2"];

export const framework2x2Layout: LayoutFn = (nodes) => {
  return nodes.map((node, i): NodePosition => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    return {
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? QUADRANT_COLORS[i % 4],
      x: START_X + col * (CELL_W + GAP),
      y: START_Y + row * (CELL_H + GAP),
      w: CELL_W,
      h: CELL_H,
    };
  });
};
