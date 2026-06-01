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
import { useMemo, useState, useCallback } from "react";
import type { ExportFormat } from "@/components/editor/ExportModal";

export function CanvasEditor() {
  const { status, selectedCandidateId, candidates } = useGenerationStore();
  const { activeDiagramType } = useEditorLayoutStore();
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateId) return null;
    return candidates.find((c) => c.id === selectedCandidateId) ?? null;
  }, [candidates, selectedCandidateId]);

  const excalidrawElements = useMemo(() => {
    if (!selectedCandidate) return [];
    try {
      return irToExcalidraw(selectedCandidate.ir) as ExcalidrawElement[];
    } catch (err) {
      console.error("[CanvasEditor] irToExcalidraw failed:", err);
      return [];
    }
  }, [selectedCandidate]);

  const showExcalidraw =
    selectedCandidateId && status === "success" && excalidrawElements.length > 0;

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      try {
        const title = selectedCandidate?.ir.title ?? "diagram";
        switch (format) {
          case "ai-svg":
            exportToIllustratorSvg({ filename: title, title });
            break;
          case "ai-pdf":
            await exportToIllustratorPdf({ filename: title, title });
            break;
          case "eps":
            await exportToEps({ filename: title, title });
            break;
          case "png":
            await exportToPng({ filename: title });
            break;
          case "svg":
            await exportToSvg({ filename: title });
            break;
          case "pptx":
            await exportToPptx({
              elements: excalidrawElements,
              filename: title,
              title,
            });
            break;
          case "pdf":
            await exportToPdf({ filename: title, title });
            break;
        }
      } catch (err) {
        console.error("[CanvasEditor] Export failed:", err);
        alert("내보내기에 실패했습니다.");
      }
    },
    [selectedCandidate, excalidrawElements],
  );

  return (
    <div className="excalidraw-wrapper flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-10 items-center gap-2 border-b px-3 text-xs">
        <span className="text-muted-foreground">
          {activeDiagramType ? `유형: ${activeDiagramType}` : "다이어그램을 생성해주세요"}
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
          <ExcalidrawWrapper initialElements={excalidrawElements} theme="light" />
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
