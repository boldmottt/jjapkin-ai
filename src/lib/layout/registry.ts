/**
 * 레이아웃 레지스트리
 *
 * 다이어그램 타입 → 레이아웃 엔진 매핑. 새 타입을 추가하려면 엔진을 만들어
 * registerLayout으로 등록(또는 아래 REGISTRY에 추가)하면 된다.
 */
import type { DiagramType } from "@/types";
import type { LayoutFn } from "./types";
import { flowchartLayout } from "./engines/flowchart";
import { mindmapLayout } from "./engines/mindmap";
import { processLayout } from "./engines/process";
import { comparisonLayout } from "./engines/comparison";
import { listLayout } from "./engines/list";
import { timelineLayout } from "./engines/timeline";

const REGISTRY = new Map<string, LayoutFn>([
  ["flowchart", flowchartLayout],
  ["mindmap", mindmapLayout],
  ["process", processLayout],
  ["comparison", comparisonLayout],
  ["list", listLayout],
  ["timeline", timelineLayout],
]);

/** 빈 레이아웃(미등록 타입의 폴백 — 과거 switch의 "default 없음=빈 배열" 동작 보존) */
const emptyLayout: LayoutFn = () => [];

export function registerLayout(type: string, fn: LayoutFn): void {
  REGISTRY.set(type, fn);
}

export function getLayout(type: DiagramType): LayoutFn {
  return REGISTRY.get(type) ?? emptyLayout;
}
