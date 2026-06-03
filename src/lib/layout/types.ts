/**
 * 레이아웃 엔진 공통 타입
 *
 * 레이아웃 엔진은 IR의 노드/엣지를 받아 "배치된 노드(NodePosition)" 배열을
 * 반환한다. Excalidraw 요소 생성은 어댑터(ir-to-excalidraw)가 담당한다.
 * → 새 다이어그램 타입 = LayoutFn 하나 추가로 끝난다.
 */
import type { DiagramIR } from "@/types";

export interface NodePosition {
  id: string;
  label: string;
  type: string;
  color: string;
  x: number;
  y: number;
}

export type LayoutFn = (
  nodes: DiagramIR["nodes"],
  edges: DiagramIR["edges"],
) => NodePosition[];
