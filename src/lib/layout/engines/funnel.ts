/**
 * 퍼널 레이아웃: 위→아래로 갈수록 좁아지는 단계(전환 퍼널).
 * 노드 순서 = 위(넓음)에서 아래(좁음). 각 단계를 중앙 정렬한다.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { START_Y } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

const CENTER_X = 400;
const LEVEL_H = 64;
const GAP = 12;
const MAX_W = 360;
const STEP_W = 60; // 단계마다 좁아지는 폭

export const funnelLayout: LayoutFn = (nodes) => {
  return nodes.map((node, i): NodePosition => {
    const w = Math.max(120, MAX_W - i * STEP_W);
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
