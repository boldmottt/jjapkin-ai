"use client";

/**
 * 다이어그램 유형 선택기
 *
 * 5종 다이어그램 유형을 아이콘 + 레이블로 표시
 * 사용자가 생성 전에 직접 유형을 선택할 수 있도록 함
 */

import { cn } from "@/lib/utils/cn";
import {
  GitFork,
  GitGraph,
  ArrowLeftRight,
  List,
  Network,
  Clock,
  LayoutGrid,
  Grid2x2,
  Triangle,
  Filter,
  Circle,
  BarChart3,
  Rows3,
} from "lucide-react";
import type { DiagramType } from "@/types";
import { DIAGRAM_TYPE_LABELS, DIAGRAM_TYPES } from "@/types";

const TYPE_ICONS: Record<DiagramType, typeof GitFork> = {
  flowchart: GitFork,
  mindmap: Network,
  process: GitGraph,
  comparison: ArrowLeftRight,
  list: List,
  timeline: Clock,
  "card-grid": LayoutGrid,
  "framework-2x2": Grid2x2,
  pyramid: Triangle,
  funnel: Filter,
  venn: Circle,
  "bar-chart": BarChart3,
  swimlane: Rows3,
};

interface TypeSelectorProps {
  selected?: DiagramType | null;
  onSelect: (type: DiagramType | null) => void;
}

export function TypeSelector({ selected, onSelect }: TypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {/* Auto (AI 추천) */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
          selected === null
            ? "border-primary bg-primary/10 text-primary"
            : "border-border hover:border-primary/50",
        )}
      >
        <span className="text-base">✨</span>
        <span>AI 추천</span>
      </button>

      {DIAGRAM_TYPES.map((type) => {
        const Icon = TYPE_ICONS[type];
        const isSelected = selected === type;

        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border hover:border-primary/50",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{DIAGRAM_TYPE_LABELS[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
