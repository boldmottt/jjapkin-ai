/**
 * IR → Excalidraw 변환기 (어댑터)
 *
 * DiagramIR의 노드/엣지를 Excalidraw Elements 배열로 변환한다.
 * 노드 배치(레이아웃)는 타입별 엔진(lib/layout)이 담당하고, 이 파일은
 * "레이아웃 호출 + Excalidraw 요소 생성"만 맡는 얇은 어댑터다.
 */

import type { DiagramIR } from "@/types";
import type { SceneElement } from "@/lib/scene/types";
import { getLayout } from "@/lib/layout/registry";
import { getDecorations } from "@/lib/layout/decorations";
import type { NodePosition } from "@/lib/layout/types";
import { NODE_W, NODE_H } from "@/lib/layout/constants";
import { textWidth } from "@/lib/layout/measure";
import { iconToDataUrl } from "@/lib/icons/render";
import { idealTextColor } from "@/lib/scene/color";

// ── Excalidraw Element 타입 (단일 SceneElement 사용) ─
// 과거의 로컬 ExElement 인터페이스는 SceneElement로 통합됨.
type ExElement = SceneElement;

// ── 요소 스타일 상수 (레이아웃 상수는 lib/layout/constants) ─
const FONT_SIZE = 16;
const STROKE_WIDTH = 2;
const FONT_FAMILY = 2; // normal

// ── 메인 변환 함수 (레이아웃 호출 + Excalidraw 어댑터) ─

export function irToExcalidraw(ir: DiagramIR): ExElement[] {
  return buildScene(ir).elements;
}

/** 변환 본체. 레이아웃을 한 번만 계산해 elements와 함께 돌려준다. */
function buildScene(ir: DiagramIR): {
  elements: ExElement[];
  positions: NodePosition[];
} {
  // ID 생성기를 함수 스코프 클로저로 둠 → 호출마다 0부터 시작하여 멱등성 보장
  let idCounter = 0;
  const uid = () => `elem_${++idCounter}`;

  const elements: ExElement[] = [];

  // 각 노드 → rectangle + (컨테이너 바운드) text
  // 레이아웃은 타입별 엔진(lib/layout)이 담당 → 어댑터는 요소 생성만.
  const nodePositions = getLayout(ir.diagramType)(ir.nodes, ir.edges);

  // 타입별 장식(타임라인 중심선·막대 기준선/값 라벨 등)
  const decorations = getDecorations(ir.diagramType, ir, nodePositions, uid);
  // 노드 뒤(배경)에 깔리는 장식 먼저
  elements.push(...(decorations.behind as ExElement[]));

  // node id → rectangle element id (화살표 바인딩에 사용)
  const rectIdByNode = new Map<string, ExElement>();
  const nodeById = new Map(ir.nodes.map((n) => [n.id, n]));

  for (const pos of nodePositions) {
    const node = nodeById.get(pos.id);
    const rect = createRectElement(pos, uid);
    applyEmphasis(rect, node?.emphasis);
    const text = createTextElement(pos, rect.id, uid);
    // 텍스트를 도형에 컨테이너 바운드로 연결 → 도형 이동 시 텍스트가 따라감
    rect.boundElements = [{ id: text.id, type: "text" }];
    rectIdByNode.set(pos.id, rect);
    elements.push(rect, text);
    // badge 강조: 우상단 작은 원
    if (node?.emphasis === "badge") {
      elements.push(createBadge(pos, uid));
    }
  }

  // 각 엣지 → arrow (양 끝 도형에 바인딩) + (있으면) 라벨 텍스트
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
    );
    elements.push(arrow);

    // 화살표를 양 끝 도형의 boundElements에 등록 → 노드 이동 시 화살표가 따라붙음
    fromRect?.boundElements?.push({ id: arrow.id, type: "arrow" });
    toRect?.boundElements?.push({ id: arrow.id, type: "arrow" });

    // 엣지 라벨 → 화살표 중간 지점에 독립 텍스트
    if (edge.label) {
      elements.push(createEdgeLabel(fromPos, toPos, edge.label, uid));
    }
  }

  // 노드 앞(전경) 장식(막대 값 라벨 등)
  elements.push(...(decorations.front as ExElement[]));

  return { elements, positions: nodePositions };
}

// ── 아이콘 포함 변환 (image 요소 + files) ────────────

/** Excalidraw BinaryFiles 호환(느슨) */
export type SceneFiles = Record<
  string,
  { mimeType: string; id: string; dataURL: string; created: number }
>;

const ICON_SIZE = 22;
const ICON_PAD = 8;

/**
 * 아이콘·제목까지 포함해 변환한다(캔버스/내보내기 실사용 경로). 아이콘은
 * image 요소로 추가되고, 그 dataURL은 files 맵에 담긴다. 아이콘은 IR의
 * node.icon에서 결정적으로 재생성되므로 files를 따로 영속화할 필요가
 * 없다(저장/복원 시 IR에서 재계산).
 */
export function irToExcalidrawWithFiles(ir: DiagramIR): {
  elements: ExElement[];
  files: SceneFiles;
} {
  const { elements, positions } = buildScene(ir);
  const files: SceneFiles = {};

  if (ir.title && positions.length > 0) {
    elements.unshift(createTitleElement(ir.title, positions));
  }

  const nodeById = new Map(ir.nodes.map((n) => [n.id, n]));

  for (const pos of positions) {
    const node = nodeById.get(pos.id);
    if (!node?.icon) continue;
    const dataURL = iconToDataUrl(
      node.icon,
      pos.textColor ?? idealTextColor(pos.color),
      48,
    );
    if (!dataURL) continue;

    const fileId = `iconfile_${pos.id}`;
    files[fileId] = {
      mimeType: "image/svg+xml",
      id: fileId,
      dataURL,
      created: 0, // 결정적(스냅샷 안정) — 실제 시각은 불필요
    };
    elements.push({
      type: "image",
      id: `iconimg_${pos.id}`,
      x: pos.x + ICON_PAD,
      y: pos.y + ICON_PAD,
      width: ICON_SIZE,
      height: ICON_SIZE,
      angle: 0,
      opacity: 100,
      fileId,
      status: "saved",
      scale: [1, 1],
      locked: false,
      boundElements: null,
    } as unknown as ExElement);
  }

  return { elements, files };
}

// ── Element 생성기 ──────────────────────────────────

function createRectElement(pos: NodePosition, uid: () => string): ExElement {
  return {
    type: pos.shape ?? "rectangle",
    id: uid(),
    x: pos.x,
    y: pos.y,
    width: pos.w ?? NODE_W,
    height: pos.h ?? NODE_H,
    backgroundColor: pos.color,
    strokeColor: "#1F2937",
    strokeWidth: STROKE_WIDTH,
    roughness: 0,
    ...(pos.opacity != null ? { opacity: pos.opacity } : {}),
    boundElements: [], // 호출부에서 text/arrow 바인딩이 추가됨
  };
}

function createTextElement(
  pos: NodePosition,
  containerId: string,
  uid: () => string,
): ExElement {
  // 컨테이너 바운드 텍스트: Excalidraw가 containerId 도형 안에 가운데 정렬로 배치
  const w = pos.w ?? NODE_W;
  const h = pos.h ?? NODE_H;
  return {
    type: "text",
    id: uid(),
    x: pos.x + 10,
    y: pos.y + h / 2 - FONT_SIZE / 2,
    width: w - 20,
    height: FONT_SIZE + 4,
    text: pos.label,
    fontSize: FONT_SIZE,
    fontFamily: FONT_FAMILY,
    // 노드 배경 대비에 맞춰 텍스트 색 자동 보정(가독성)
    strokeColor: pos.textColor ?? idealTextColor(pos.color),
    roughness: 0,
    containerId,
    textAlign: "center",
    verticalAlign: "middle",
    boundElements: null,
  };
}

/**
 * 두 노드의 상대 위치에 따라 화살표가 닿을 변(상/하/좌/우)의 중점을 고른다.
 * 항상 "아래→위"로만 잇던 과거 방식은 가로 레이아웃(process/timeline)이나
 * 방사형(mindmap)에서 화살표가 노드를 관통해 보였다.
 */
function anchorPoints(
  from: NodePosition,
  to: NodePosition,
): { fromX: number; fromY: number; toX: number; toY: number } {
  const fw = from.w ?? NODE_W;
  const fh = from.h ?? NODE_H;
  const tw = to.w ?? NODE_W;
  const th = to.h ?? NODE_H;
  const dx = to.x + tw / 2 - (from.x + fw / 2);
  const dy = to.y + th / 2 - (from.y + fh / 2);

  if (Math.abs(dx) > Math.abs(dy)) {
    // 가로 우세: from의 좌/우 변 ↔ to의 반대 변
    return {
      fromX: from.x + (dx > 0 ? fw : 0),
      fromY: from.y + fh / 2,
      toX: to.x + (dx > 0 ? 0 : tw),
      toY: to.y + th / 2,
    };
  }
  // 세로 우세: from의 상/하 변 ↔ to의 반대 변
  return {
    fromX: from.x + fw / 2,
    fromY: from.y + (dy > 0 ? fh : 0),
    toX: to.x + tw / 2,
    toY: to.y + (dy > 0 ? 0 : th),
  };
}

function createArrowElement(
  from: NodePosition,
  to: NodePosition,
  uid: () => string,
  fromId: string | undefined,
  toId: string | undefined,
): ExElement {
  const { fromX, fromY, toX, toY } = anchorPoints(from, to);

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

// ── 데코레이터 / 엣지 라벨 ──────────────────────────

const HIGHLIGHT_COLOR = "#F59E0B";

/** 강조(highlight): 두꺼운 강조색 테두리 */
function applyEmphasis(rect: ExElement, emphasis?: string): void {
  if (emphasis === "highlight") {
    rect.strokeColor = HIGHLIGHT_COLOR;
    rect.strokeWidth = 4;
  }
}

/** 강조(badge): 도형 우상단의 작은 강조색 원 */
function createBadge(pos: NodePosition, uid: () => string): ExElement {
  const w = pos.w ?? NODE_W;
  const r = 12;
  return {
    type: "ellipse",
    id: uid(),
    x: pos.x + w - r,
    y: pos.y - r,
    width: r * 2,
    height: r * 2,
    backgroundColor: HIGHLIGHT_COLOR,
    strokeColor: "#ffffff",
    strokeWidth: 2,
    fillStyle: "solid",
    roughness: 0,
    boundElements: null,
  };
}

/** 엣지 라벨: 두 노드 중간 지점의 독립 텍스트(흰 배경으로 화살표 위에 가독) */
function createEdgeLabel(
  from: NodePosition,
  to: NodePosition,
  label: string,
  uid: () => string,
): ExElement {
  const fromCx = from.x + (from.w ?? NODE_W) / 2;
  const fromCy = from.y + (from.h ?? NODE_H) / 2;
  const toCx = to.x + (to.w ?? NODE_W) / 2;
  const toCy = to.y + (to.h ?? NODE_H) / 2;
  const midX = (fromCx + toCx) / 2;
  const midY = (fromCy + toCy) / 2;
  // CJK 폭 반영(글자수×8은 한글 라벨이 잘림). 라벨 폰트는 12px = 16px의 0.75배
  const width = Math.max(40, Math.ceil(textWidth(label) * 0.75) + 16);
  return {
    type: "text",
    id: uid(),
    x: midX - width / 2,
    y: midY - (FONT_SIZE - 2) / 2,
    width,
    height: FONT_SIZE,
    text: label,
    fontSize: FONT_SIZE - 4,
    fontFamily: FONT_FAMILY,
    strokeColor: "#6B7280",
    backgroundColor: "#ffffff",
    roughness: 0,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: null,
    boundElements: null,
  };
}

/** 다이어그램 제목: 노드 영역 상단 중앙의 큰 텍스트(내보내기에도 포함됨) */
function createTitleElement(
  title: string,
  positions: NodePosition[],
): ExElement {
  const TITLE_SIZE = 24;
  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x + (p.w ?? NODE_W)));
  const minY = Math.min(...positions.map((p) => p.y));
  const width = Math.max(80, Math.ceil(textWidth(title) * (TITLE_SIZE / 16)));
  return {
    type: "text",
    id: "diagram_title",
    x: (minX + maxX) / 2 - width / 2,
    y: minY - TITLE_SIZE - 36,
    width,
    height: TITLE_SIZE + 8,
    text: title,
    fontSize: TITLE_SIZE,
    fontFamily: FONT_FAMILY,
    strokeColor: "#111827",
    roughness: 0,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: null,
    boundElements: null,
  };
}

// ── 재내보내기 ──────────────────────────────────────
// ExElement는 SceneElement의 별칭(하위호환). 신규 코드는 SceneElement 사용 권장.
export type { ExElement, NodePosition };
