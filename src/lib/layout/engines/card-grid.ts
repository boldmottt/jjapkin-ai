/**
 * 카드 그리드 레이아웃: 인포그래픽 카드들을 N열 그리드로 배치.
 * 엣지는 보통 없음(독립 카드). 카드 크기를 키워 가독성을 높인다.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { START_X, START_Y } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

const CARD_W = 200;
const CARD_H = 110;
const GAP = 32;

export const cardGridLayout: LayoutFn = (nodes) => {
  const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(nodes.length))));
  return nodes.map((node, i): NodePosition => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
      x: START_X + col * (CARD_W + GAP),
      y: START_Y + row * (CARD_H + GAP),
      w: CARD_W,
      h: CARD_H,
    };
  });
};
