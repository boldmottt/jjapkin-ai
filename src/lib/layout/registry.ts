/**
 * 레이아웃 레지스트리
 *
 * 다이어그램 타입 → 레이아웃 엔진 매핑. 새 타입을 추가하려면 엔진을 만들어
 * registerLayout으로 등록(또는 아래 REGISTRY에 추가)하면 된다.
 */
import type { DiagramType } from "@/types";
import type { LayoutFn } from "./types";
import { makeAutoLayout } from "./engines/auto";
import { mindmapLayout } from "./engines/mindmap";
import { comparisonLayout } from "./engines/comparison";
import { listLayout } from "./engines/list";
import { timelineLayout } from "./engines/timeline";
import { cardGridLayout } from "./engines/card-grid";
import { framework2x2Layout } from "./engines/framework-2x2";
import { pyramidLayout } from "./engines/pyramid";
import { funnelLayout } from "./engines/funnel";
import { vennLayout } from "./engines/venn";
import { barChartLayout } from "./engines/bar-chart";
import { swimlaneLayout } from "./engines/swimlane";

const REGISTRY = new Map<string, LayoutFn>([
  // 그래프형: dagre 자동 레이아웃(노드 크기 반영, 겹침 제거)
  ["flowchart", makeAutoLayout({ rankdir: "TB" })],
  ["process", makeAutoLayout({ rankdir: "LR" })],
  // 고유 기하 레이아웃
  ["mindmap", mindmapLayout],
  ["comparison", comparisonLayout],
  ["list", listLayout],
  ["timeline", timelineLayout],
  ["card-grid", cardGridLayout],
  ["framework-2x2", framework2x2Layout],
  ["pyramid", pyramidLayout],
  ["funnel", funnelLayout],
  ["venn", vennLayout],
  ["bar-chart", barChartLayout],
  ["swimlane", swimlaneLayout],
]);

/** 빈 레이아웃(미등록 타입의 폴백 — 과거 switch의 "default 없음=빈 배열" 동작 보존) */
const emptyLayout: LayoutFn = () => [];

export function registerLayout(type: string, fn: LayoutFn): void {
  REGISTRY.set(type, fn);
}

export function getLayout(type: DiagramType): LayoutFn {
  return REGISTRY.get(type) ?? emptyLayout;
}
