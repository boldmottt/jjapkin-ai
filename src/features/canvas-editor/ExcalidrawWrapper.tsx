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
import { useCallback } from "react";
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

  return (
    <div className="h-full w-full">
      <ExcalidrawLazy
        initialData={{
          elements: (initialElements ?? []) as never[],
          appState: {
            viewBackgroundColor: theme === "dark" ? "#1e1e2e" : "#ffffff",
            theme,
          },
        }}
        excalidrawAPI={onApiReady}
        onChange={handleChange as never}
        viewModeEnabled={readOnly}
        zenModeEnabled={false}
        gridModeEnabled={false}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: !readOnly,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: true,
            saveAsImage: false,
          },
          tools: {
            image: false,
          },
        }}
      />
    </div>
  );
}
