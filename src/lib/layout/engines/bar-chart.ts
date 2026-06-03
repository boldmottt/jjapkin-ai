/**
 * 막대 차트 레이아웃: 노드 value에 비례한 높이의 세로 막대.
 * value가 없으면 (역순) 인덱스 기반으로 보정해 항상 그려지게 한다.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { START_X } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

const BASELINE_Y = 420; // 막대 바닥
const MAX_H = 280; // 최대 막대 높이
const BAR_W = 70;
const GAP = 36;

export const barChartLayout: LayoutFn = (nodes) => {
  const values = nodes.map((n, i) =>
    typeof n.value === "number" && Number.isFinite(n.value)
      ? n.value
      : nodes.length - i, // value 없으면 내림차순 보정
  );
  const max = Math.max(1, ...values);

  let x = START_X;
  return nodes.map((node, i): NodePosition => {
    const h = Math.max(24, Math.round((values[i] / max) * MAX_H));
    const pos: NodePosition = {
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
      x,
      y: BASELINE_Y - h,
      w: BAR_W,
      h,
    };
    x += BAR_W + GAP;
    return pos;
  });
};
