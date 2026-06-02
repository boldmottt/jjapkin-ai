"use client";

import { useGenerationStore, useEditorLayoutStore } from "@/stores";
import { irToExcalidraw } from "@/lib/ai/ir-to-excalidraw";
import { ExcalidrawWrapper, type ExcalidrawElement } from "./ExcalidrawWrapper";
import { ExportModal } from "@/components/editor/ExportModal";
import {
  exportToPng,
  exportToSvg,
  exportToPptx,
  exportToPdf,
  exportToIllustratorSvg,
  exportToIllustratorPdf,
  exportToEps,
} from "../export-pipeline";
import { useMemo, useRef, useState, useCallback } from "react";
import type { ExportFormat } from "@/components/editor/ExportModal";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { toast } from "@/stores/toast";
import { DIAGRAM_TYPE_LABELS } from "@/types";
import type { DiagramType } from "@/types";

export function CanvasEditor() {
  const { status, selectedCandidateId, candidates, saveScene } =
    useGenerationStore();
  const { activeDiagramType } = useEditorLayoutStore();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateId) return null;
    return candidates.find((c) => c.id === selectedCandidateId) ?? null;
  }, [candidates, selectedCandidateId]);

  const excalidrawElements = useMemo(() => {
    if (!selectedCandidate) return [];
    // 이전에 편집해 둔 장면이 있으면 그것을 복원 (후보 전환 시 편집 보존)
    const saved = useGenerationStore.getState().editedScenes[selectedCandidate.id];
    if (saved && saved.length > 0) return saved as ExcalidrawElement[];
    try {
      return irToExcalidraw(selectedCandidate.ir) as ExcalidrawElement[];
    } catch (err) {
      console.error("[CanvasEditor] irToExcalidraw failed:", err);
      return [];
    }
  }, [selectedCandidate]);

  // 편집 내용을 디바운스 저장 (후보 전환 후 돌아와도 유지)
  const handleSceneChange = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      if (!selectedCandidateId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveScene(selectedCandidateId, elements);
      }, 500);
    },
    [selectedCandidateId, saveScene],
  );

  const showExcalidraw =
    selectedCandidateId && status === "success" && excalidrawElements.length > 0;

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const api = apiRef.current;
      if (!api) {
        toast.error("캔버스가 아직 준비되지 않았습니다.");
        return;
      }
      try {
        const title = selectedCandidate?.ir.title ?? "diagram";
        switch (format) {
          case "ai-svg":
            await exportToIllustratorSvg({ api, filename: title, title });
            break;
          case "ai-pdf":
            await exportToIllustratorPdf({ api, filename: title, title });
            break;
          case "eps":
            await exportToEps({ api, filename: title, title });
            break;
          case "png":
            await exportToPng({ api, filename: title });
            break;
          case "svg":
            await exportToSvg({ api, filename: title });
            break;
          case "pptx":
            await exportToPptx({ api, filename: title, title });
            break;
          case "pdf":
            await exportToPdf({ api, filename: title, title });
            break;
        }
        toast.success(`${format.toUpperCase()} 내보내기 완료`);
      } catch (err) {
        console.error("[CanvasEditor] Export failed:", err);
        toast.error(err instanceof Error ? err.message : "내보내기에 실패했습니다.");
      }
    },
    [selectedCandidate],
  );

  return (
    <div className="excalidraw-wrapper flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-10 items-center gap-2 border-b px-3 text-xs">
        <span className="text-muted-foreground">
          {activeDiagramType
            ? `유형: ${DIAGRAM_TYPE_LABELS[activeDiagramType as DiagramType] ?? activeDiagramType}`
            : "다이어그램을 생성해주세요"}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setExportModalOpen(true)}
          disabled={!showExcalidraw}
          className="rounded px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-30"
        >
          📥 내보내기
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1">
        {status === "loading" ? (
          <div className="flex h-full items-center justify-center bg-muted/30">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>AI가 다이어그램을 생성 중입니다...</span>
            </div>
          </div>
        ) : showExcalidraw ? (
          <ExcalidrawWrapper
            // 후보가 바뀌면 remount하여 해당 후보의 (편집된) 장면을 로드
            key={selectedCandidateId}
            initialElements={excalidrawElements}
            onApiReady={(api) => {
              apiRef.current = api;
            }}
            onChange={handleSceneChange}
            theme="light"
          />
        ) : status === "error" ? (
          <div className="flex h-full items-center justify-center bg-muted/30">
            <div className="text-center text-destructive">
              <p className="text-lg">생성에 실패했습니다</p>
              <p className="mt-1 text-xs text-muted-foreground">다시 시도해주세요</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/30">
            <div className="text-center text-muted-foreground">
              <p className="mb-2 text-4xl">📝</p>
              <p className="text-base font-medium">JJapkin AI</p>
              <p className="mt-1 text-sm">좌측에 텍스트를 입력하고</p>
              <p className="text-sm">&lsquo;다이어그램 생성&rsquo; 버튼을 눌러주세요</p>
              <p className="mt-4 text-xs text-muted-foreground/60">
                DeepSeek AI가 자동으로 다이어그램을 만들어드립니다
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}
