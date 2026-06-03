"use client";

import { useGenerationStore, useEditorLayoutStore } from "@/stores";
import { useDiagramHistoryStore } from "@/stores/diagram-history";
import { DIAGRAM_TYPE_LABELS } from "@/types";
import { Clock, X } from "lucide-react";
import { toast } from "@/stores/toast";
import type { DiagramType, GenerationCandidate } from "@/types";

interface CandidatePanelProps {
  className?: string;
}

export function CandidatePanel({ className }: CandidatePanelProps) {
  const { candidates, status, selectedCandidateId, selectCandidate, error } =
    useGenerationStore();
  const hydratePersisted = useGenerationStore((s) => s.hydratePersisted);
  const setActiveDiagramType = useEditorLayoutStore((s) => s.setActiveDiagramType);
  const { entries, removeEntry } = useDiagramHistoryStore();

  const restoreFromHistory = (candidate: GenerationCandidate) => {
    hydratePersisted(candidate, []);
    setActiveDiagramType(candidate.ir.diagramType);
    toast.info("이전 다이어그램을 불러왔어요.");
  };

  const hasHistory = entries.length > 0;

  if (status === "loading") {
    return (
      <div className={`flex h-40 items-center justify-center border-t ${className}`}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>AI가 다이어그램을 생성 중입니다...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`flex h-40 items-center justify-center border-t ${className}`}>
        <div className="text-center">
          <p className="font-semibold text-destructive">생성 실패</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-t bg-background ${className}`}>
      {/* 현재 생성된 후보 */}
      {candidates.length > 0 && (
        <>
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-sm font-semibold">현재 다이어그램</h3>
            <span className="text-xs text-muted-foreground">{candidates.length}개 후보</span>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3">
            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => selectCandidate(candidate.id)}
                className={`w-48 flex-shrink-0 rounded-lg border p-3 text-left transition-all ${
                  selectedCandidateId === candidate.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="mb-2 flex h-24 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  {DIAGRAM_TYPE_LABELS[candidate.ir.diagramType as DiagramType] ??
                    candidate.ir.diagramType}
                </div>
                <p className="truncate text-sm font-medium">{candidate.ir.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {DIAGRAM_TYPE_LABELS[candidate.ir.diagramType as DiagramType]}
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* 히스토리 (이전 생성 결과) */}
      {hasHistory && (
        <div className="border-t">
          <div className="flex items-center gap-2 px-4 py-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground">이전 생성 결과</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="relative w-40 flex-shrink-0 rounded-lg border text-left text-xs transition-colors hover:border-primary/50"
              >
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="absolute right-1 top-1 z-10 rounded p-0.5 hover:bg-muted"
                  aria-label="삭제"
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  onClick={() => restoreFromHistory(entry.candidate)}
                  className="block w-full p-2 text-left"
                  title="이 다이어그램 불러오기"
                >
                  <p className="mr-4 truncate font-medium">{entry.candidate.ir.title}</p>
                  <p className="text-muted-foreground">
                    {DIAGRAM_TYPE_LABELS[entry.candidate.ir.diagramType as DiagramType]}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground/60">
                    {entry.text}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
