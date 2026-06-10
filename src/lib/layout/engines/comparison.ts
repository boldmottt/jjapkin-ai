/**
 * 비교표 레이아웃: 좌/우 2컬럼 배치(짝수 인덱스=좌, 홀수=우).
 * 노드 크기는 라벨에 맞춰 조정하고, 컬럼별로 세로 누적 배치한다.
 */
import { START_Y } from "../constants";
import { measureNodeSize } from "../measure";
import type { DiagramIR } from "@/types";
import type { LayoutFn, NodePosition } from "../types";

const GAP = 28;
const LEFT_X = 150;
const RIGHT_X = 500;

export const comparisonLayout: LayoutFn = (nodes) => {
  const positions: NodePosition[] = [];

  const placeColumn = (column: DiagramIR["nodes"], startX: number) => {
    let y = START_Y;
    for (const node of column) {
      const { w, h } = measureNodeSize(node.label);
      positions.push({
        id: node.id,
        label: node.label,
        type: "process",
        color: node.color ?? (startX < 400 ? "#93C5FD" : "#FCD34D"),
        x: startX,
        y,
        w,
        h,
      });
      y += h + GAP;
    }
  };

  placeColumn(
    nodes.filter((_, i) => i % 2 === 0),
    LEFT_X,
  );
  placeColumn(
    nodes.filter((_, i) => i % 2 === 1),
    RIGHT_X,
  );

  return positions;
};
