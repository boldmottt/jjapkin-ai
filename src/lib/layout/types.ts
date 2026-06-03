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
  /** 도형 종류 힌트(미지정 시 어댑터가 rectangle). 예: ellipse, diamond */
  shape?: "rectangle" | "ellipse" | "diamond";
  /** 노드별 크기 오버라이드(미지정 시 기본 NODE_W/NODE_H) */
  w?: number;
  h?: number;
  /** 텍스트 색 오버라이드(미지정 시 어댑터가 배경 대비로 자동) */
  textColor?: string;
  /** 불투명도 0~100(미지정 시 100). 벤다이어그램 겹침 표현 등 */
  opacity?: number;
}

export type LayoutFn = (
  nodes: DiagramIR["nodes"],
  edges: DiagramIR["edges"],
) => NodePosition[];
