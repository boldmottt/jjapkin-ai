/**
 * 피라미드 레이아웃: 위→아래로 갈수록 넓어지는 계층(기초가 넓은 구조).
 * 노드 순서 = 위에서 아래. 각 층을 중앙 정렬한다.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { START_Y } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

const CENTER_X = 400;
const LEVEL_H = 64;
const GAP = 12;
const MIN_W = 140;
const STEP_W = 90; // 층마다 넓어지는 폭

export const pyramidLayout: LayoutFn = (nodes) => {
  return nodes.map((node, i): NodePosition => {
    const w = MIN_W + i * STEP_W;
    return {
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
      x: CENTER_X - w / 2,
      y: START_Y + i * (LEVEL_H + GAP),
      w,
      h: LEVEL_H,
    };
  });
};
