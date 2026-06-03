/**
 * 자동 레이아웃 (dagre) — 그래프형 다이어그램용
 *
 * 노드 크기를 라벨에서 측정해 dagre에 넘기므로 겹침이 없고, 분기/계층이
 * 자연스럽게 정렬된다. flowchart/process/mindmap/swimlane 등 엣지 기반
 * 타입에 사용한다.
 */
import dagre from "dagre";
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { measureNodeSize } from "../measure";
import type { LayoutFn, NodePosition } from "../types";

export interface AutoLayoutOptions {
  rankdir?: "TB" | "LR";
  ranksep?: number;
  nodesep?: number;
}

export function makeAutoLayout(opts: AutoLayoutOptions = {}): LayoutFn {
  const { rankdir = "TB", ranksep = 70, nodesep = 50 } = opts;

  return (nodes, edges) => {
    if (nodes.length === 0) return [];

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir, ranksep, nodesep, marginx: 40, marginy: 40 });
    g.setDefaultEdgeLabel(() => ({}));

    const sizeById = new Map<string, { w: number; h: number }>();
    for (const n of nodes) {
      const { w, h } = measureNodeSize(n.label);
      sizeById.set(n.id, { w, h });
      g.setNode(n.id, { width: w, height: h });
    }
    for (const e of edges) {
      if (sizeById.has(e.from) && sizeById.has(e.to)) {
        g.setEdge(e.from, e.to);
      }
    }

    dagre.layout(g);

    return nodes.map((n): NodePosition => {
      const gn = g.node(n.id) as { x: number; y: number } | undefined;
      const size = sizeById.get(n.id)!;
      // dagre는 중심 좌표 → 좌상단으로 변환
      const cx = gn?.x ?? 0;
      const cy = gn?.y ?? 0;
      return {
        id: n.id,
        label: n.label,
        type: n.type ?? "process",
        color: n.color ?? DEFAULT_NODE_COLORS[n.type ?? "process"],
        x: cx - size.w / 2,
        y: cy - size.h / 2,
        w: size.w,
        h: size.h,
      };
    });
  };
}
