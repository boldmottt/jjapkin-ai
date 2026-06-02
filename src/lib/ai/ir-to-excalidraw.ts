/**
 * IR → Excalidraw 변환기
 *
 * DiagramIR의 노드/엣지 구조를 Excalidraw Elements 배열로 변환합니다.
 * 자동 레이아웃을 포함한 완전한 변환 파이프라인.
 */

import type { DiagramIR, DiagramType } from "@/types";
import { DEFAULT_NODE_COLORS } from "./parser";

// ── Excalidraw Element 타입 (경량화) ───────────────

interface ExElement {
  type: string;          // "rectangle" | "text" | "arrow"
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // 텍스트 요소
  text?: string;
  fontSize?: number;
  fontFamily?: number;   // Excalidraw 폰트 ID (1=hand-drawn, 2=normal, 3=code)
  containerId?: string | null; // 컨테이너 바운드 텍스트가 속한 도형 id
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  // 도형 공통
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  roughness?: number;     // 0=직선, 1=손그림, 2=중간
  // 화살표
  startBinding?: { elementId: string; focus: number; gap: number };
  endBinding?: { elementId: string; focus: number; gap: number };
  points?: [number, number][];
  // 그룹
  groupIds?: string[];
  boundElements?: { id: string; type: string }[] | null;
}

// ── 상수 ────────────────────────────────────────────

const NODE_W = 160;
const NODE_H = 60;
const H_GAP = 80;  // 수평 간격 (노드 사이)
const V_GAP = 60;  // 수직 간격 (층 사이)
const START_X = 100;
const START_Y = 80;
const FONT_SIZE = 16;
const STROKE_WIDTH = 2;
const FONT_FAMILY = 2; // normal

// ── 메인 변환 함수 ──────────────────────────────────

export function irToExcalidraw(ir: DiagramIR): ExElement[] {
  // ID 생성기를 함수 스코프 클로저로 둠 → 호출마다 0부터 시작하여 멱등성 보장
  let idCounter = 0;
  const uid = () => `elem_${++idCounter}`;

  const elements: ExElement[] = [];

  // 각 노드 → rectangle + (컨테이너 바운드) text
  const nodePositions = layoutNodes(ir.nodes, ir.edges, ir.diagramType);

  // node id → rectangle element id (화살표 바인딩에 사용)
  const rectIdByNode = new Map<string, ExElement>();

  for (const pos of nodePositions) {
    const rect = createRectElement(pos, uid);
    const text = createTextElement(pos, rect.id, uid);
    // 텍스트를 도형에 컨테이너 바운드로 연결 → 도형 이동 시 텍스트가 따라감
    rect.boundElements = [{ id: text.id, type: "text" }];
    rectIdByNode.set(pos.id, rect);
    elements.push(rect, text);
  }

  // 각 엣지 → arrow (양 끝 도형에 바인딩)
  for (const edge of ir.edges) {
    const fromPos = nodePositions.find((n) => n.id === edge.from);
    const toPos = nodePositions.find((n) => n.id === edge.to);
    if (!fromPos || !toPos) continue;

    const fromRect = rectIdByNode.get(edge.from);
    const toRect = rectIdByNode.get(edge.to);
    const arrow = createArrowElement(
      fromPos,
      toPos,
      uid,
      fromRect?.id,
      toRect?.id,
      edge.label,
    );
    elements.push(arrow);

    // 화살표를 양 끝 도형의 boundElements에 등록 → 노드 이동 시 화살표가 따라붙음
    fromRect?.boundElements?.push({ id: arrow.id, type: "arrow" });
    toRect?.boundElements?.push({ id: arrow.id, type: "arrow" });
  }

  return elements;
}

// ── 노드 레이아웃 ───────────────────────────────────

interface NodePosition {
  id: string;
  label: string;
  type: string;
  color: string;
  x: number;
  y: number;
}

function layoutNodes(
  nodes: DiagramIR["nodes"],
  edges: DiagramIR["edges"],
  diagramType: DiagramType,
): NodePosition[] {
  const positions: NodePosition[] = [];

  switch (diagramType) {
    case "flowchart": {
      // Top-to-bottom 순차 배치 (분기 노드는 수평 분산)
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
      break;
    }

    case "mindmap": {
      // Radial 배치: 루트 중심, 자식 둘러싸기
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
      break;
    }

    case "process": {
      // Left-to-right 선형 배치
      let x = START_X;
      const y = 300 - NODE_H / 2;

      for (const node of nodes) {
        positions.push({
          id: node.id,
          label: node.label,
          type: node.type ?? "process",
          color: node.color ?? DEFAULT_NODE_COLORS[node.type ?? "process"],
          x,
          y,
        });
        x += NODE_W + H_GAP;
      }
      break;
    }

    case "comparison": {
      // 좌/우 컬럼 매트릭스
      const leftNodes = nodes.filter((_, i) => i % 2 === 0);
      const rightNodes = nodes.filter((_, i) => i % 2 === 1);
      const leftX = 150;
      const rightX = 500;

      const placeColumn = (column: typeof nodes, startX: number) => {
        let y = START_Y;
        for (const node of column) {
          positions.push({
            id: node.id,
            label: node.label,
            type: "process",
            color: node.color ?? (startX < 400 ? "#93C5FD" : "#FCD34D"),
            x: startX,
            y,
          });
          y += NODE_H + V_GAP;
        }
      };

      placeColumn(leftNodes, leftX);
      placeColumn(rightNodes, rightX);
      break;
    }

    case "list": {
      // 세로 리스트, 교차 배경색
      let y = START_Y;
      const x = 250;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        positions.push({
          id: node.id,
          label: node.label,
          type: "process",
          color: node.color ?? (i % 2 === 0 ? "#F3F4F6" : "#E5E7EB"),
          x,
          y,
        });
        y += NODE_H + V_GAP;
      }
      break;
    }
  }

  return positions;
}

// ── Flowchart 레이아웃 (Topological sort + row 분할) ──

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
}

// ── Element 생성기 ──────────────────────────────────

function createRectElement(pos: NodePosition, uid: () => string): ExElement {
  return {
    type: "rectangle",
    id: uid(),
    x: pos.x,
    y: pos.y,
    width: NODE_W,
    height: NODE_H,
    backgroundColor: pos.color,
    strokeColor: "#1F2937",
    strokeWidth: STROKE_WIDTH,
    roughness: 0,
    boundElements: [], // 호출부에서 text/arrow 바인딩이 추가됨
  };
}

function createTextElement(
  pos: NodePosition,
  containerId: string,
  uid: () => string,
): ExElement {
  // 컨테이너 바운드 텍스트: Excalidraw가 containerId 도형 안에 가운데 정렬로 배치
  return {
    type: "text",
    id: uid(),
    x: pos.x + 10,
    y: pos.y + NODE_H / 2 - FONT_SIZE / 2,
    width: NODE_W - 20,
    height: FONT_SIZE + 4,
    text: pos.label,
    fontSize: FONT_SIZE,
    fontFamily: FONT_FAMILY,
    strokeColor: "#1F2937",
    roughness: 0,
    containerId,
    textAlign: "center",
    verticalAlign: "middle",
    boundElements: null,
  };
}

function createArrowElement(
  from: NodePosition,
  to: NodePosition,
  uid: () => string,
  fromId: string | undefined,
  toId: string | undefined,
  /**
   * label은 향후 edge 라벨 렌더링에 사용 예정
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _label?: string,
): ExElement {
  const fromX = from.x + NODE_W / 2;
  const fromY = from.y + NODE_H;
  const toX = to.x + NODE_W / 2;
  const toY = to.y;

  return {
    type: "arrow",
    id: uid(),
    x: Math.min(fromX, toX),
    y: Math.min(fromY, toY),
    width: Math.abs(toX - fromX) || 10,
    height: Math.abs(toY - fromY) || 10,
    strokeColor: "#6B7280",
    strokeWidth: STROKE_WIDTH,
    roughness: 0,
    // 양 끝 도형에 바인딩 → 노드를 움직이면 화살표 끝점이 따라감
    startBinding: fromId ? { elementId: fromId, focus: 0, gap: 4 } : undefined,
    endBinding: toId ? { elementId: toId, focus: 0, gap: 4 } : undefined,
    points: [
      [fromX - Math.min(fromX, toX), fromY - Math.min(fromY, toY)],
      [toX - Math.min(fromX, toX), toY - Math.min(fromY, toY)],
    ],
    boundElements: null,
  };
}

// ── 재내보내기 ──────────────────────────────────────
export type { ExElement, NodePosition };
