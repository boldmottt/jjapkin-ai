/**
 * 마인드맵 레이아웃: 루트를 중앙에 두고 자식을 원형(radial)으로 배치.
 */
import { NODE_W, NODE_H } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

export const mindmapLayout: LayoutFn = (nodes) => {
  const positions: NodePosition[] = [];
  const root = nodes[0];
  const children = nodes.slice(1);
  const cx = 400;
  const cy = 300;

  positions.push({
    id: root.id,
    label: root.label,
    type: "start",
    color: root.color ?? "#1E40AF",
    x: cx - NODE_W / 2,
    y: cy - NODE_H / 2,
  });

  const radius = 180;
  const angleStep = (2 * Math.PI) / children.length;

  for (let i = 0; i < children.length; i++) {
    const angle = -Math.PI / 2 + angleStep * i;
    const child = children[i];
    positions.push({
      id: child.id,
      label: child.label,
      type: "process",
      color: child.color ?? "#3B82F6",
      x: cx + radius * Math.cos(angle) - NODE_W / 2,
      y: cy + radius * Math.sin(angle) - NODE_H / 2,
    });
  }

  return positions;
};
