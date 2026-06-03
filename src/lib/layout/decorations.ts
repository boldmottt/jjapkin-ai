/**
 * 타입별 장식 요소 (노드가 아닌 보조 그래픽)
 *
 * 엔진은 노드(NodePosition)만 반환하므로, 타임라인 중심선·막대차트 기준선/값
 * 라벨 같은 "노드가 아닌" 요소는 여기서 생성한다. 어댑터가 노드 뒤(behind)와
 * 앞(front)에 끼워 넣는다.
 */
import type { DiagramIR } from "@/types";
import type { SceneElement } from "@/lib/scene/types";
import type { NodePosition } from "./types";

export interface Decorations {
  behind: SceneElement[];
  front: SceneElement[];
}

type DecorationFn = (
  ir: DiagramIR,
  positions: NodePosition[],
  uid: () => string,
) => Decorations;

const empty = (): Decorations => ({ behind: [], front: [] });

/** 타임라인: 노드들을 가로지르는 중심선 */
const timelineDecor: DecorationFn = (_ir, positions, uid) => {
  if (positions.length < 2) return empty();
  const centers = positions.map((p) => ({
    x: p.x + (p.w ?? 160) / 2,
    y: p.y + (p.h ?? 60) / 2,
  }));
  const minX = Math.min(...centers.map((c) => c.x));
  const maxX = Math.max(...centers.map((c) => c.x));
  const y = 280; // timeline 엔진의 centerY와 일치
  return {
    behind: [
      {
        type: "line",
        id: uid(),
        x: minX,
        y,
        width: maxX - minX,
        height: 0,
        strokeColor: "#94A3B8",
        strokeWidth: 3,
        roughness: 0,
        points: [
          [0, 0],
          [maxX - minX, 0],
        ],
        boundElements: null,
      } as unknown as SceneElement,
    ],
    front: [],
  };
};

/** 막대차트: 바닥 기준선 + 각 막대 위 값 라벨 */
const barChartDecor: DecorationFn = (ir, positions, uid) => {
  if (positions.length === 0) return empty();
  const nodeById = new Map(ir.nodes.map((n) => [n.id, n]));
  const baseline = Math.max(...positions.map((p) => p.y + (p.h ?? 0)));
  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x + (p.w ?? 0)));

  const front: SceneElement[] = [];
  for (const p of positions) {
    const node = nodeById.get(p.id);
    if (typeof node?.value !== "number") continue;
    const w = p.w ?? 70;
    front.push({
      type: "text",
      id: uid(),
      x: p.x,
      y: p.y - 20,
      width: w,
      height: 16,
      text: String(node.value),
      fontSize: 12,
      fontFamily: 2,
      strokeColor: "#475569",
      textAlign: "center",
      verticalAlign: "middle",
      containerId: null,
      boundElements: null,
    } as unknown as SceneElement);
  }

  return {
    behind: [
      {
        type: "line",
        id: uid(),
        x: minX - 16,
        y: baseline,
        width: maxX - minX + 32,
        height: 0,
        strokeColor: "#94A3B8",
        strokeWidth: 2,
        roughness: 0,
        points: [
          [0, 0],
          [maxX - minX + 32, 0],
        ],
        boundElements: null,
      } as unknown as SceneElement,
    ],
    front,
  };
};

const DECOR: Record<string, DecorationFn> = {
  timeline: timelineDecor,
  "bar-chart": barChartDecor,
};

export function getDecorations(
  type: string,
  ir: DiagramIR,
  positions: NodePosition[],
  uid: () => string,
): Decorations {
  const fn = DECOR[type];
  return fn ? fn(ir, positions, uid) : empty();
}
