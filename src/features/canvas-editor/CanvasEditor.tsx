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
  exportToVectorPdf,
  exportToIllustratorSvg,
  exportToIllustratorPdf,
} from "../export-pipeline";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { ExportFormat } from "@/components/editor/ExportModal";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { toast } from "@/stores/toast";
import { DIAGRAM_TYPE_LABELS } from "@/types";
import type { DiagramType } from "@/types";
import { Layers as LayersIcon, SlidersHorizontal } from "lucide-react";
import { LayersPanel } from "./LayersPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import type { SceneChangeMeta } from "./ExcalidrawWrapper";
import {
  buildLayers,
  setLayerHidden,
  setLayerLocked,
  reorderLayer,
  type LayerItem,
} from "@/lib/layers";
import {
  applyProps,
  flipElements,
  alignElements,
  distributeElements,
  createShadows,
  getSelected,
  type PropEl,
  type AlignMode,
} from "@/lib/element-props";

export function CanvasEditor() {
  const { status, selectedCandidateId, candidates, saveScene } =
    useGenerationStore();
  const { activeDiagramType } = useEditorLayoutStore();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showProps, setShowProps] = useState(true);
  const [sceneElements, setSceneElements] = useState<readonly ExcalidrawElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
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

  // 편집 내용을 디바운스 저장 + 레이어/속성 패널용 장면·선택 추적
  const handleSceneChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: SceneChangeMeta) => {
      setSceneElements(elements);
      const sel = appState.selectedElementIds ?? {};
      setSelectedIds(new Set(Object.keys(sel).filter((id) => sel[id])));
      if (!selectedCandidateId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveScene(selectedCandidateId, elements);
      }, 500);
    },
    [selectedCandidateId, saveScene],
  );

  // 후보가 바뀌면 패널/장면 상태 초기화
  useEffect(() => {
    setSceneElements([]);
    setSelectedIds(new Set());
    setShowLayers(false);
  }, [selectedCandidateId]);

  const applyElements = useCallback((next: readonly ExcalidrawElement[]) => {
    apiRef.current?.updateScene({ elements: next as never });
    setSceneElements(next);
  }, []);

  const layerItems = useMemo(() => buildLayers(sceneElements), [sceneElements]);

  const selectedElements = useMemo(
    () => getSelected(sceneElements as unknown as PropEl[], selectedIds),
    [sceneElements, selectedIds],
  );

  const handlePatch = useCallback(
    (patch: Record<string, unknown>) =>
      applyElements(
        applyProps(sceneElements as unknown as PropEl[], selectedIds, patch) as unknown as ExcalidrawElement[],
      ),
    [applyElements, sceneElements, selectedIds],
  );
  const handleFlip = useCallback(
    (axis: "horizontal" | "vertical") =>
      applyElements(
        flipElements(sceneElements as unknown as PropEl[], selectedIds, axis) as unknown as ExcalidrawElement[],
      ),
    [applyElements, sceneElements, selectedIds],
  );
  const handleAlign = useCallback(
    (mode: AlignMode) =>
      applyElements(
        alignElements(sceneElements as unknown as PropEl[], selectedIds, mode) as unknown as ExcalidrawElement[],
      ),
    [applyElements, sceneElements, selectedIds],
  );
  const handleDistribute = useCallback(
    (axis: "horizontal" | "vertical") =>
      applyElements(
        distributeElements(sceneElements as unknown as PropEl[], selectedIds, axis) as unknown as ExcalidrawElement[],
      ),
    [applyElements, sceneElements, selectedIds],
  );
  const handleAddShadow = useCallback(
    () =>
      applyElements(
        createShadows(sceneElements as unknown as PropEl[], selectedIds) as unknown as ExcalidrawElement[],
      ),
    [applyElements, sceneElements, selectedIds],
  );

  const handleToggleVisibility = useCallback(
    (item: LayerItem) => applyElements(setLayerHidden(sceneElements, item, !item.hidden)),
    [applyElements, sceneElements],
  );
  const handleToggleLock = useCallback(
    (item: LayerItem) => applyElements(setLayerLocked(sceneElements, item, !item.locked)),
    [applyElements, sceneElements],
  );
  const handleReorder = useCallback(
    (key: string, direction: "up" | "down") =>
      applyElements(reorderLayer(sceneElements, layerItems, key, direction)),
    [applyElements, sceneElements, layerItems],
  );
  const handleSelectLayer = useCallback((item: LayerItem) => {
    const selectedElementIds = Object.fromEntries(
      item.elementIds.map((id) => [id, true]),
    );
    apiRef.current?.updateScene({ appState: { selectedElementIds } as never });
  }, []);

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
          case "pdf-vector":
            await exportToVectorPdf({ api, filename: title, title });
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
          onClick={() => setShowProps((v) => !v)}
          disabled={!showExcalidraw}
          className={
            "inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-30 " +
            (showProps
              ? "bg-primary/10 text-primary"
              : "border hover:border-primary/50")
          }
          aria-pressed={showProps}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          속성
        </button>
        <button
          onClick={() => setShowLayers((v) => !v)}
          disabled={!showExcalidraw}
          className={
            "inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-30 " +
            (showLayers
              ? "bg-primary/10 text-primary"
              : "border hover:border-primary/50")
          }
          aria-pressed={showLayers}
        >
          <LayersIcon className="h-3.5 w-3.5" />
          레이어
        </button>
        <button
          onClick={() => setExportModalOpen(true)}
          disabled={!showExcalidraw}
          className="rounded px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-30"
        >
          📥 내보내기
        </button>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1">
        {status === "loading" ? (
          <div className="flex h-full items-center justify-center bg-muted/30">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>AI가 다이어그램을 생성 중입니다...</span>
            </div>
          </div>
        ) : showExcalidraw ? (
          <>
            <ExcalidrawWrapper
              // 후보가 바뀌면 remount하여 해당 후보의 (편집된) 장면을 로드
              key={selectedCandidateId}
              initialElements={excalidrawElements}
              onApiReady={(api) => {
                apiRef.current = api;
                setSceneElements(
                  api.getSceneElements() as unknown as readonly ExcalidrawElement[],
                );
              }}
              onChange={handleSceneChange}
              theme="light"
            />
            {showLayers && (
              <LayersPanel
                items={layerItems}
                onClose={() => setShowLayers(false)}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
                onReorder={handleReorder}
                onSelect={handleSelectLayer}
              />
            )}
            {showProps && selectedElements.length > 0 && (
              <PropertiesPanel
                elements={selectedElements}
                onPatch={handlePatch}
                onFlip={handleFlip}
                onAlign={handleAlign}
                onDistribute={handleDistribute}
                onAddShadow={handleAddShadow}
                onClose={() => setShowProps(false)}
              />
            )}
          </>
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
