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
import type { NodePosition } from "@/lib/layout/types";
import { NODE_W, NODE_H } from "@/lib/layout/constants";
import { iconToDataUrl } from "@/lib/icons/render";

// ── Excalidraw Element 타입 (단일 SceneElement 사용) ─
// 과거의 로컬 ExElement 인터페이스는 SceneElement로 통합됨.
type ExElement = SceneElement;

// ── 요소 스타일 상수 (레이아웃 상수는 lib/layout/constants) ─
const FONT_SIZE = 16;
const STROKE_WIDTH = 2;
const FONT_FAMILY = 2; // normal

// ── 메인 변환 함수 (레이아웃 호출 + Excalidraw 어댑터) ─

export function irToExcalidraw(ir: DiagramIR): ExElement[] {
  // ID 생성기를 함수 스코프 클로저로 둠 → 호출마다 0부터 시작하여 멱등성 보장
  let idCounter = 0;
  const uid = () => `elem_${++idCounter}`;

  const elements: ExElement[] = [];

  // 각 노드 → rectangle + (컨테이너 바운드) text
  // 레이아웃은 타입별 엔진(lib/layout)이 담당 → 어댑터는 요소 생성만.
  const nodePositions = getLayout(ir.diagramType)(ir.nodes, ir.edges);

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

// ── 아이콘 포함 변환 (image 요소 + files) ────────────

/** Excalidraw BinaryFiles 호환(느슨) */
export type SceneFiles = Record<
  string,
  { mimeType: string; id: string; dataURL: string; created: number }
>;

const ICON_SIZE = 22;
const ICON_PAD = 8;

/**
 * 아이콘까지 포함해 변환한다. 아이콘은 image 요소로 추가되고, 그 dataURL은
 * files 맵에 담긴다. 아이콘은 IR의 node.icon에서 결정적으로 재생성되므로
 * files를 따로 영속화할 필요가 없다(저장/복원 시 IR에서 재계산).
 */
export function irToExcalidrawWithFiles(ir: DiagramIR): {
  elements: ExElement[];
  files: SceneFiles;
} {
  const elements = irToExcalidraw(ir);
  const files: SceneFiles = {};

  const positions = getLayout(ir.diagramType)(ir.nodes, ir.edges);
  const nodeById = new Map(ir.nodes.map((n) => [n.id, n]));

  for (const pos of positions) {
    const node = nodeById.get(pos.id);
    if (!node?.icon) continue;
    const dataURL = iconToDataUrl(node.icon, pos.textColor ?? "#1F2937", 48);
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
    strokeColor: pos.textColor ?? "#1F2937",
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
  const fromX = from.x + (from.w ?? NODE_W) / 2;
  const fromY = from.y + (from.h ?? NODE_H);
  const toX = to.x + (to.w ?? NODE_W) / 2;
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
// ExElement는 SceneElement의 별칭(하위호환). 신규 코드는 SceneElement 사용 권장.
export type { ExElement, NodePosition };
