// ── JJapkin AI 타입 정의 ────────────────────────────
// PRD 기반 도메인 타입

// ── 다이어그램 유형 ─────────────────────────────────
export const DIAGRAM_TYPES = [
  "flowchart",
  "mindmap",
  "process",
  "comparison",
  "list",
] as const;

export type DiagramType = (typeof DIAGRAM_TYPES)[number];

export const DIAGRAM_TYPE_LABELS: Record<DiagramType, string> = {
  flowchart: "플로우차트",
  mindmap: "마인드맵",
  process: "프로세스",
  comparison: "비교표",
  list: "리스트",
};

// ── AI 파이프라인 ───────────────────────────────────
/** AI가 생성하는 노드 */
export interface DiagramNode {
  id: string;
  label: string;
  type?: "start" | "process" | "decision" | "end";
  color?: string;
  children?: DiagramNode[]; // mindmap / hierarchy
}

/** AI가 생성하는 엣지 */
export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

/** AI가 반환하는 중간 표현 (JSON Schema) */
export interface DiagramIR {
  diagramType: DiagramType;
  title: string;
  description?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/** AI 생성 후보 하나 */
export interface GenerationCandidate {
  id: string;
  ir: DiagramIR;
  previewSvg?: string; // Mermaid 변환된 SVG 프리뷰
}

/** AI 생성 요청 */
export interface GenerationRequest {
  text: string;
  diagramType?: DiagramType; // 사용자가 직접 지정 (없으면 AI 추천)
  language?: string;
}

/** AI 생성 응답 */
export interface GenerationResponse {
  candidates: GenerationCandidate[];
  recommendedType: DiagramType;
  tokensUsed: number;
  fromCache: boolean;
}

// ── Excalidraw 연동 ────────────────────────────────
// Excalidraw 타입은 @excalidraw/excalidraw에서 직접 import
// import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
// import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";

/** Excalidraw 요소 타입 (excalidraw 패키지에서 동적 import) */
export type ExcalidrawElement = Record<string, unknown>;
export type AppState = Record<string, unknown>;
export type BinaryFiles = Record<string, { dataURL: string }>;

/** Excalidraw 캔버스 상태 (Zustand) */
export interface CanvasState {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

// ── 문서 ────────────────────────────────────────────
export interface DocumentData {
  id: string;
  title: string;
  rawText: string;
  visuals: VisualData[];
  createdAt: string;
  updatedAt: string;
}

export interface VisualData {
  id: string;
  sourceText: string;
  diagramType: DiagramType;
  excalidrawData: ExcalidrawElement[];
  thumbnailUrl?: string;
  sortOrder: number;
}

// ── 내보내기 ────────────────────────────────────────
export type ExportFormat = "png" | "svg" | "pdf" | "pptx";

export interface ExportOptions {
  format: ExportFormat;
  background?: boolean; // PNG 배경
  scale?: number; // 해상도 배율
  darkMode?: boolean; // PDF/SVG 다크모드
}

// ── 브랜드 스튜디오 ─────────────────────────────────
export interface BrandStyle {
  id: string;
  name: string;
  primaryColor: string;
  accentColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  isDefault: boolean;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// ── API 응답 타입 ───────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ── 이벤트 트래킹 (분석) ────────────────────────────
export type TrackingEvent =
  | { type: "generate_start"; textLength: number }
  | { type: "generate_complete"; candidateCount: number; durationMs: number }
  | { type: "candidate_select"; diagramType: DiagramType }
  | { type: "export"; format: ExportFormat }
  | { type: "edit"; action: "move" | "resize" | "color_change" | "text_edit" };
