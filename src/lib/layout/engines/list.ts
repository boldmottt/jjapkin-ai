/**
 * 리스트 레이아웃: 세로 나열, 교차 배경색. 노드 크기는 라벨에 맞춰 조정.
 */
import { START_Y } from "../constants";
import { measureNodeSize } from "../measure";
import type { LayoutFn, NodePosition } from "../types";

const GAP = 24;
const X = 250;

export const listLayout: LayoutFn = (nodes) => {
  let y = START_Y;
  return nodes.map((node, i): NodePosition => {
    const { w, h } = measureNodeSize(node.label);
    const pos: NodePosition = {
      id: node.id,
      label: node.label,
      type: "process",
      color: node.color ?? (i % 2 === 0 ? "#F3F4F6" : "#E5E7EB"),
      x: X,
      y,
      w,
      h,
    };
    y += h + GAP;
    return pos;
  });
};
