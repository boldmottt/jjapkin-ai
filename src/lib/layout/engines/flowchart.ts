/**
 * 플로우차트 레이아웃: 위상정렬(BFS)로 층을 나누고 Top-to-bottom 배치.
 * 분기 노드는 같은 층에서 수평 분산, 사이클 등 남은 노드는 마지막 층에 추가.
 */
import type { DiagramIR } from "@/types";
import { DEFAULT_NODE_COLORS } from "@/lib/ai/parser";
import { NODE_W, NODE_H, H_GAP, V_GAP, START_Y } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

export const flowchartLayout: LayoutFn = (nodes, edges) => {
  const positions: NodePosition[] = [];
  const rows = layoutFlowchartRows(nodes, edges);
  let y = START_Y;
  const centerX = 400;

  for (const row of rows) {
    const rowWidth = (row.length - 1) * (NODE_W + H_GAP);
    const startX = centerX - rowWidth / 2;

    for (let i = 0; i < row.length; i++) {
      const node = row[i];
      positions.push({
        id: node.id,
        label: node.label,
        type: node.type ?? "process",
        color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
        x: startX + i * (NODE_W + H_GAP),
        y,
      });
    }
    y += NODE_H + V_GAP;
  }

  return positions;
};

/** 위상 정렬(BFS)로 노드를 row 단위로 그룹화 */
function layoutFlowchartRows(
  nodes: DiagramIR["nodes"],
  edges: DiagramIR["edges"],
): Array<DiagramIR["nodes"]> {
  const rows: Array<DiagramIR["nodes"]> = [];
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    outEdges.set(n.id, []);
  }

  for (const e of edges) {
    const out = outEdges.get(e.from);
    if (out) out.push(e.to);
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }

  // BFS 위상 정렬로 row 단위 그룹화
  let queue = nodes.filter((n) => inDegree.get(n.id) === 0);
  const visited = new Set<string>();

  while (queue.length > 0) {
    const row = [...queue];
    rows.push(row);
    visited.clear();

    const nextQueue: typeof queue = [];
    for (const node of queue) {
      const children = outEdges.get(node.id) ?? [];
      for (const childId of children) {
        if (visited.has(childId)) continue; // 같은 row에 중복 추가 방지
        const deg = (inDegree.get(childId) ?? 1) - 1;
        inDegree.set(childId, deg);
        if (deg === 0) {
          visited.add(childId);
          const childNode = nodeMap.get(childId);
          if (childNode) nextQueue.push(childNode);
        }
      }
    }

    queue = nextQueue;
  }

  // 남은 노드 (사이클 등) 마지막 row에 추가
  const remaining = nodes.filter((n) => {
    return !rows.some((r) => r.some((rn) => rn.id === n.id));
  });
  if (remaining.length > 0) {
    rows.push(remaining);
  }

  return rows;
};
