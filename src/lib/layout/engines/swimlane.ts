/**
 * 스윔레인 레이아웃: 노드를 group(레인)별 가로 행으로 배치.
 * 같은 레인 노드는 좌→우 순서대로. group이 없으면 node.type을 레인으로 사용.
 * 노드 크기는 라벨에 맞춰 조정하고, 레인 높이는 그 레인의 최대 높이를 따른다.
 */
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { H_GAP, V_GAP, START_X, START_Y } from "../constants";
import { measureNodeSize } from "../measure";
import type { LayoutFn, NodePosition } from "../types";

export const swimlaneLayout: LayoutFn = (nodes) => {
  // 레인 키 = group ?? type ?? "default", 첫 등장 순서로 레인 행 결정
  const laneKey = (n: (typeof nodes)[number]) => n.group ?? n.type ?? "default";
  const lanes: string[] = [];
  for (const n of nodes) {
    if (!lanes.includes(laneKey(n))) lanes.push(laneKey(n));
  }

  // 레인별 행 높이 = 레인 내 최대 노드 높이
  const sizeById = new Map(nodes.map((n) => [n.id, measureNodeSize(n.label)]));
  const laneY = new Map<string, number>();
  let y = START_Y;
  for (const lane of lanes) {
    laneY.set(lane, y);
    const laneH = Math.max(
      ...nodes.filter((n) => laneKey(n) === lane).map((n) => sizeById.get(n.id)!.h),
    );
    y += laneH + V_GAP;
  }

  const laneX = new Map<string, number>(); // 레인별 다음 노드의 x
  return nodes.map((node): NodePosition => {
    const k = laneKey(node);
    const { w, h } = sizeById.get(node.id)!;
    const x = laneX.get(k) ?? START_X;
    laneX.set(k, x + w + H_GAP);
    return {
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
      x,
      y: laneY.get(k)!,
      w,
      h,
    };
  });
};
