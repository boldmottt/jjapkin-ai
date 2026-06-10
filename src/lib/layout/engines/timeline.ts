/**
 * 타임라인 레이아웃: 좌→우 가로 배치, 노드를 중심선 위/아래로 번갈아 배치.
 * 노드 폭은 라벨에 맞춰 조정하고, 가로로 누적 배치한다.
 * 순차 엣지는 어댑터가 화살표로 렌더링한다.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { H_GAP, START_X } from "../constants";
import { measureNodeSize } from "../measure";
import type { LayoutFn, NodePosition } from "../types";

const CENTER_Y = 280;
const OFFSET = 70; // 중심선에서 노드까지의 거리

export const timelineLayout: LayoutFn = (nodes) => {
  let x = START_X;
  return nodes.map((node, i): NodePosition => {
    const { w, h } = measureNodeSize(node.label);
    const above = i % 2 === 0;
    const pos: NodePosition = {
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
      x,
      y: above ? CENTER_Y - OFFSET - h : CENTER_Y + OFFSET,
      w,
      h,
    };
    x += w + H_GAP;
    return pos;
  });
};
