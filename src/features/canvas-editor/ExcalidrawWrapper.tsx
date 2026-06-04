"use client";

/**
 * Excalidraw 래퍼 컴포넌트
 *
 * @excalidraw/excalidraw 패키지의 Excalidraw 컴포넌트를
 * JJapkin의 편집기 요구사항에 맞게 감쌉니다.
 *
 * 주요 기능:
 * - 초기 Elements 로딩
 * - 편집 상태 변경 콜백
 * - 테마 연동 (light/dark)
 * - 다이어그램 유형별 툴바 제한
 */

import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { SceneElement } from "@/lib/scene/types";

// Excalidraw는 CSR 전용 (window 객체 의존)
const ExcalidrawLazy = dynamic(
  () =>
    import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

// Excalidraw Element 타입 = 정규 SceneElement (별칭, 하위호환)
export type ExcalidrawElement = SceneElement;

/** onChange가 함께 전달하는 최소 앱 상태 (선택 등) */
export interface SceneChangeMeta {
  selectedElementIds?: Record<string, boolean>;
}

interface ExcalidrawWrapperProps {
  /** 초기 요소 (IR → Excalidraw 변환 결과) */
  initialElements?: ExcalidrawElement[];
  /** 초기 파일(아이콘 등 image 요소의 dataURL 맵) */
  initialFiles?: Record<string, unknown>;
  /** 편집 상태 변경 콜백 (요소 + 선택 등 앱 상태) */
  onChange?: (
    elements: readonly ExcalidrawElement[],
    appState: SceneChangeMeta,
  ) => void;
  /** imperative API 준비 콜백 (export/persist에 사용) */
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
  /** 테마 (light/dark) */
  theme?: "light" | "dark";
  /** readonly 모드 (조감도) */
  readOnly?: boolean;
}

export function ExcalidrawWrapper({
  initialElements,
  initialFiles,
  onChange,
  onApiReady,
  theme = "light",
  readOnly = false,
}: ExcalidrawWrapperProps) {
  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: SceneChangeMeta) => {
      onChange?.(elements, appState);
    },
    [onChange],
  );

  // 객체 prop은 "안정적인" 참조여야 한다. 매 렌더 새 객체를 넘기면 Excalidraw가
  // 끊임없이 재렌더(내부 tunnel-rat 포함)되어 무한 루프로 이어질 수 있다.
  // (컴포넌트는 후보별 key로 remount되므로 deps는 마운트당 한 번만 바뀜)
  const initialData = useMemo(
    () => ({
      elements: (initialElements ?? []) as never[],
      files: (initialFiles ?? {}) as never,
      appState: {
        viewBackgroundColor: theme === "dark" ? "#1e1e2e" : "#ffffff",
        theme,
      },
    }),
    [initialElements, initialFiles, theme],
  );

  const uiOptions = useMemo(
    () => ({
      canvasActions: {
        changeViewBackgroundColor: false,
        clearCanvas: !readOnly,
        export: false as const,
        loadScene: false,
        saveToActiveFile: false,
        toggleTheme: true,
        saveAsImage: false,
      },
      tools: { image: false },
    }),
    [readOnly],
  );

  return (
    <div className="h-full w-full">
      <ExcalidrawLazy
        initialData={initialData}
        excalidrawAPI={onApiReady}
        onChange={handleChange as never}
        viewModeEnabled={readOnly}
        zenModeEnabled={false}
        gridModeEnabled={false}
        UIOptions={uiOptions}
      />
    </div>
  );
}
