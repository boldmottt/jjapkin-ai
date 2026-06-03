"use client";

/**
 * 레이어 패널
 *
 * 장면 요소를 레이어 항목으로 보여주고 표시/숨김·잠금·순서변경·선택을 제공.
 * 상위(CanvasEditor)가 Excalidraw API를 통해 실제 연산을 수행한다.
 */

import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, X } from "lucide-react";
import type { LayerItem } from "@/lib/layers";
import { cn } from "@/lib/utils/cn";

interface LayersPanelProps {
  items: LayerItem[];
  onClose: () => void;
  onToggleVisibility: (item: LayerItem) => void;
  onToggleLock: (item: LayerItem) => void;
  onReorder: (key: string, direction: "up" | "down") => void;
  onSelect: (item: LayerItem) => void;
}

export function LayersPanel({
  items,
  onClose,
  onToggleVisibility,
  onToggleLock,
  onReorder,
  onSelect,
}: LayersPanelProps) {
  return (
    <div className="absolute right-3 top-3 z-20 flex max-h-[calc(100%-1.5rem)] w-60 flex-col rounded-lg border bg-background/95 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold">레이어 ({items.length})</span>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted"
          aria-label="레이어 패널 닫기"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="px-3 py-4 text-xs text-muted-foreground">요소가 없습니다.</p>
      ) : (
        <ul className="flex-1 overflow-y-auto py-1">
          {items.map((item, idx) => (
            <li
              key={item.key}
              className={cn(
                "group flex items-center gap-1 px-2 py-1.5 text-xs hover:bg-muted/60",
                item.hidden && "opacity-50",
              )}
            >
              {/* 표시/숨김 */}
              <button
                onClick={() => onToggleVisibility(item)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={item.hidden ? "표시" : "숨김"}
                title={item.hidden ? "표시" : "숨김"}
              >
                {item.hidden ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>

              {/* 이름 (클릭 = 선택) */}
              <button
                onClick={() => onSelect(item)}
                className="min-w-0 flex-1 truncate text-left"
                title={item.label}
              >
                {item.label}
              </button>

              {/* 순서 변경 */}
              <button
                onClick={() => onReorder(item.key, "up")}
                disabled={idx === 0}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                aria-label="앞으로"
                title="앞으로"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onReorder(item.key, "down")}
                disabled={idx === items.length - 1}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                aria-label="뒤로"
                title="뒤로"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {/* 잠금 */}
              <button
                onClick={() => onToggleLock(item)}
                className={cn(
                  "shrink-0 rounded p-1 hover:text-foreground",
                  item.locked ? "text-foreground" : "text-muted-foreground",
                )}
                aria-label={item.locked ? "잠금 해제" : "잠금"}
                title={item.locked ? "잠금 해제" : "잠금"}
              >
                {item.locked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
