"use client";

import { useGenerationStore, useEditorLayoutStore } from "@/stores";
import {
  irToExcalidrawWithFiles,
  type SceneFiles,
} from "@/lib/ai/ir-to-excalidraw";
import { iconToDataUrl } from "@/lib/icons/render";
import { applyTheme, THEMES } from "@/lib/themes";
import { applyEditOps } from "@/lib/scene/edit";
import { useRegisterCommands } from "@/hooks/useCommands";
import type { Command } from "@/stores/commands";
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
  type AlignMode,
} from "@/lib/element-props";

export function CanvasEditor() {
  const { status, selectedCandidateId, candidates, saveScene } =
    useGenerationStore();
  const { activeDiagramType } = useEditorLayoutStore();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showProps, setShowProps] = useState(true);
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const [sceneElements, setSceneElements] = useState<readonly ExcalidrawElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateId) return null;
    return candidates.find((c) => c.id === selectedCandidateId) ?? null;
  }, [candidates, selectedCandidateId]);

  // 장면(요소 + 아이콘 files). 아이콘 files는 IR에서 결정적으로 재생성되므로
  // 편집 저장본을 복원할 때도 files만 IR에서 다시 계산해 아이콘이 유지된다.
  const scene = useMemo((): {
    elements: ExcalidrawElement[];
    files: SceneFiles;
  } => {
    if (!selectedCandidate) return { elements: [], files: {} };
    let built: { elements: ExcalidrawElement[]; files: SceneFiles };
    try {
      built = irToExcalidrawWithFiles(selectedCandidate.ir) as {
        elements: ExcalidrawElement[];
        files: SceneFiles;
      };
    } catch (err) {
      console.error("[CanvasEditor] irToExcalidraw failed:", err);
      return { elements: [], files: {} };
    }
    const state = useGenerationStore.getState();
    const saved = state.editedScenes[selectedCandidate.id];
    const elements =
      saved && saved.length > 0
        ? (saved as ExcalidrawElement[])
        : built.elements;
    // IR 재생성 아이콘 files + 사용자가 수동 추가/스왑한 files 병합
    const manualFiles =
      (state.editedFiles[selectedCandidate.id] as SceneFiles) ?? {};
    return { elements, files: { ...built.files, ...manualFiles } };
  }, [selectedCandidate]);

  const excalidrawElements = scene.elements;

  // 편집 내용을 디바운스 저장 + 레이어/속성 패널용 장면·선택 추적
  const handleSceneChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: SceneChangeMeta) => {
      setSceneElements(elements);
      const sel = appState.selectedElementIds ?? {};
      setSelectedIds(new Set(Object.keys(sel).filter((id) => sel[id])));
      if (!selectedCandidateId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        // 수동 추가 아이콘 등 files도 함께 저장(저장/복원 시 유지)
        const files = apiRef.current?.getFiles() as
          | Record<string, unknown>
          | undefined;
        saveScene(selectedCandidateId, elements, files);
      }, 500);
    },
    [selectedCandidateId, saveScene],
  );

  // 후보가 바뀌면 패널/장면 상태 초기화
  useEffect(() => {
    setSceneElements([]);
    setSelectedIds(new Set());
    setShowLayers(false);
    setSuggestDismissed(false);
  }, [selectedCandidateId]);

  const applyElements = useCallback((next: readonly ExcalidrawElement[]) => {
    apiRef.current?.updateScene({ elements: next as never });
    setSceneElements(next);
  }, []);

  // 스마트 제안: 첫 노드 강조
  const handleSuggestEmphasize = useCallback(() => {
    const first = sceneElements.find((e) =>
      ["rectangle", "ellipse", "diamond"].includes(String(e.type)),
    );
    if (!first) return;
    applyElements(
      applyEditOps(sceneElements, new Set([first.id]), [{ op: "emphasize" }]),
    );
    toast.success("첫 노드 강조");
  }, [sceneElements, applyElements]);

  const layerItems = useMemo(() => buildLayers(sceneElements), [sceneElements]);

  const selectedElements = useMemo(
    () => getSelected(sceneElements, selectedIds),
    [sceneElements, selectedIds],
  );

  const handlePatch = useCallback(
    (patch: Record<string, unknown>) =>
      applyElements(applyProps(sceneElements, selectedIds, patch)),
    [applyElements, sceneElements, selectedIds],
  );
  const handleFlip = useCallback(
    (axis: "horizontal" | "vertical") =>
      applyElements(flipElements(sceneElements, selectedIds, axis)),
    [applyElements, sceneElements, selectedIds],
  );
  const handleAlign = useCallback(
    (mode: AlignMode) =>
      applyElements(alignElements(sceneElements, selectedIds, mode)),
    [applyElements, sceneElements, selectedIds],
  );
  const handleDistribute = useCallback(
    (axis: "horizontal" | "vertical") =>
      applyElements(distributeElements(sceneElements, selectedIds, axis)),
    [applyElements, sceneElements, selectedIds],
  );
  const handleAddShadow = useCallback(
    () => applyElements(createShadows(sceneElements, selectedIds)),
    [applyElements, sceneElements, selectedIds],
  );

  // 선택한 도형 좌상단에 아이콘(image 요소)을 얹는다. 파일은 API에 추가하고,
  // 다음 onChange에서 editedFiles로 저장되어 저장/복원 시 유지된다.
  const handleSetIcon = useCallback(
    (iconId: string) => {
      const api = apiRef.current;
      if (!api) return;
      const target = sceneElements.find((e) => selectedIds.has(e.id));
      if (!target) {
        toast.error("아이콘을 넣을 도형을 먼저 선택하세요.");
        return;
      }
      const dataURL = iconToDataUrl(iconId, "#1F2937", 48);
      if (!dataURL) {
        toast.error("아이콘을 찾을 수 없습니다.");
        return;
      }
      const fileId = `iconmanual_${target.id}`;
      api.addFiles([
        {
          mimeType: "image/svg+xml",
          id: fileId,
          dataURL,
          created: Date.now(),
        } as never,
      ]);
      const tx = (target.x as number) ?? 0;
      const ty = (target.y as number) ?? 0;
      const image: ExcalidrawElement = {
        type: "image",
        id: `iconimg_manual_${target.id}_${Date.now()}`,
        x: tx + 8,
        y: ty + 8,
        width: 22,
        height: 22,
        angle: 0,
        opacity: 100,
        fileId,
        status: "saved",
        scale: [1, 1],
        locked: false,
        boundElements: null,
      } as unknown as ExcalidrawElement;
      applyElements([...sceneElements, image]);
      toast.success("아이콘 추가됨");
    },
    [sceneElements, selectedIds, applyElements],
  );

  // AI 세부 수정: 선택 객체 + 자연어 지시 → /api/edit → op 적용
  const [aiEditing, setAiEditing] = useState(false);
  const handleAiEdit = useCallback(
    async (instruction: string) => {
      if (selectedIds.size === 0) {
        toast.error("수정할 객체를 먼저 선택하세요.");
        return;
      }
      const selection = sceneElements
        .filter((e) => selectedIds.has(e.id))
        .map((el) => ({
          id: el.id,
          type: String(el.type),
          label:
            (el.text as string | undefined) ??
            (sceneElements.find(
              (t) => t.type === "text" && t.containerId === el.id,
            )?.text as string | undefined),
          backgroundColor: el.backgroundColor as string | undefined,
        }));
      setAiEditing(true);
      try {
        const res = await fetch("/api/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction, selection }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message ?? "AI 수정 실패");
        const ops = json.data.ops as Parameters<typeof applyEditOps>[2];
        applyElements(applyEditOps(sceneElements, selectedIds, ops));
        toast.success(`AI 수정 적용 (${ops.length}개 변경)`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "AI 수정 실패");
      } finally {
        setAiEditing(false);
      }
    },
    [sceneElements, selectedIds, applyElements],
  );

  // 원클릭 정리: IR에서 깔끔히 재배치 + 기본 테마 적용 (지저분한 장면 복구)
  const handleBeautify = useCallback(() => {
    if (!selectedCandidate) return;
    try {
      const { elements } = irToExcalidrawWithFiles(selectedCandidate.ir);
      applyElements(applyTheme(elements as ExcalidrawElement[], "corporate"));
      toast.success("정리 완료 — 재배치 + 테마 적용");
    } catch {
      toast.error("정리에 실패했습니다.");
    }
  }, [selectedCandidate, applyElements]);

  const handleApplyTheme = useCallback(
    (themeId: string) => {
      if (sceneElements.length === 0) return;
      applyElements(applyTheme(sceneElements, themeId));
      toast.success(
        `테마 적용: ${THEMES.find((t) => t.id === themeId)?.label ?? themeId}`,
      );
    },
    [applyElements, sceneElements],
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

  // 커맨드 팔레트(⌘K)에 캔버스 액션 등록
  const paletteCommands = useMemo<Command[]>(
    () => [
      {
        id: "cmd-beautify",
        label: "정리 (재배치 + 테마)",
        group: "편집",
        keywords: "beautify cleanup tidy 정리",
        run: () => handleBeautify(),
      },
      {
        id: "cmd-export",
        label: "내보내기…",
        group: "파일",
        keywords: "export png svg pdf",
        run: () => setExportModalOpen(true),
      },
      {
        id: "cmd-toggle-props",
        label: "속성 패널 토글",
        group: "보기",
        run: () => setShowProps((v) => !v),
      },
      {
        id: "cmd-toggle-layers",
        label: "레이어 패널 토글",
        group: "보기",
        run: () => setShowLayers((v) => !v),
      },
      ...THEMES.map((t) => ({
        id: `cmd-theme-${t.id}`,
        label: `테마: ${t.label}`,
        group: "테마",
        keywords: "theme style",
        run: () => handleApplyTheme(t.id),
      })),
    ],
    [handleApplyTheme, handleBeautify],
  );
  useRegisterCommands(paletteCommands);

  const showExcalidraw =
    selectedCandidateId && status === "success" && excalidrawElements.length > 0;

  const handleExport = useCallback(
    async (format: ExportFormat, opts?: { scale?: number }) => {
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
            await exportToPng({ api, filename: title, scale: opts?.scale ?? 2 });
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
          onClick={handleBeautify}
          disabled={!showExcalidraw}
          className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 disabled:opacity-30"
          title="재배치 + 테마로 한 번에 정리"
        >
          ✨ 정리
        </button>
        <select
          aria-label="테마 적용"
          defaultValue=""
          disabled={!showExcalidraw}
          onChange={(e) => {
            if (e.target.value) handleApplyTheme(e.target.value);
            e.target.value = "";
          }}
          className="rounded border bg-transparent px-2 py-1.5 text-xs outline-none transition-colors hover:border-primary/50 disabled:opacity-30"
        >
          <option value="" disabled>
            🎨 테마
          </option>
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
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
              initialFiles={scene.files}
              onApiReady={(api) => {
                apiRef.current = api;
                setSceneElements(
                  api.getSceneElements() as unknown as readonly ExcalidrawElement[],
                );
              }}
              onChange={handleSceneChange}
              theme="light"
            />
            {!suggestDismissed && sceneElements.length > 0 && (
              <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-background/95 px-2 py-1 text-xs shadow-md backdrop-blur">
                <span className="px-1 text-muted-foreground">제안</span>
                <button
                  onClick={handleBeautify}
                  className="rounded-full border px-2 py-0.5 transition-colors hover:border-primary/50"
                >
                  ✨ 정리
                </button>
                <button
                  onClick={handleSuggestEmphasize}
                  className="rounded-full border px-2 py-0.5 transition-colors hover:border-primary/50"
                >
                  ⭐ 첫 노드 강조
                </button>
                <button
                  onClick={() => handleApplyTheme("corporate")}
                  className="rounded-full border px-2 py-0.5 transition-colors hover:border-primary/50"
                >
                  🎨 테마
                </button>
                <button
                  onClick={() => setSuggestDismissed(true)}
                  aria-label="제안 닫기"
                  className="rounded-full px-1 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            )}
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
                onSetIcon={handleSetIcon}
                onAiEdit={handleAiEdit}
                aiEditing={aiEditing}
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
