/**
 * 비교표 레이아웃: 좌/우 2컬럼 배치(짝수 인덱스=좌, 홀수=우).
 */
import { NODE_H, V_GAP, START_Y } from "../constants";
import type { DiagramIR } from "@/types";
import type { LayoutFn, NodePosition } from "../types";

export const comparisonLayout: LayoutFn = (nodes) => {
  const positions: NodePosition[] = [];
  const leftNodes = nodes.filter((_, i) => i % 2 === 0);
  const rightNodes = nodes.filter((_, i) => i % 2 === 1);
  const leftX = 150;
  const rightX = 500;

  const placeColumn = (column: DiagramIR["nodes"], startX: number) => {
    let y = START_Y;
    for (const node of column) {
      positions.push({
        id: node.id,
        label: node.label,
        type: "process",
        color: node.color ?? (startX < 400 ? "#93C5FD" : "#FCD34D"),
        x: startX,
        y,
      });
      y += NODE_H + V_GAP;
    }
  };

  placeColumn(leftNodes, leftX);
  placeColumn(rightNodes, rightX);

  return positions;
};
