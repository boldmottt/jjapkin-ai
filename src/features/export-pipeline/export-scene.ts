/**
 * Excalidraw 라이브 장면 export 헬퍼
 *
 * DOM에서 직접 <svg>/<canvas>를 긁어오던 방식은 Excalidraw가 장면을
 * <canvas>로 렌더링하기 때문에 동작하지 않았다(UI 아이콘 SVG가 잡힘).
 * 대신 Excalidraw가 공식 제공하는 exportToSvg/exportToBlob를 사용해
 * imperative API로부터 실제 장면 요소를 읽어 export한다.
 * 사용자의 편집 결과도 그대로 반영된다.
 */

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

/** export 함수들이 공통으로 받는 장면 소스 */
export type SceneApi = Pick<
  ExcalidrawImperativeAPI,
  "getSceneElements" | "getAppState" | "getFiles"
>;

function getElementsOrThrow(api: SceneApi) {
  const elements = api.getSceneElements();
  if (!elements || elements.length === 0) {
    throw new Error("내보낼 다이어그램이 없습니다. 먼저 다이어그램을 생성하세요.");
  }
  return elements;
}

/** 라이브 장면 → SVG 요소 */
export async function sceneToSvg(
  api: SceneApi,
  opts: { background?: boolean } = {},
): Promise<SVGSVGElement> {
  const { exportToSvg } = await import("@excalidraw/excalidraw");
  const elements = getElementsOrThrow(api);

  return exportToSvg({
    elements,
    appState: {
      ...api.getAppState(),
      exportBackground: opts.background ?? true,
      exportWithDarkMode: false,
    },
    files: api.getFiles(),
    exportPadding: 16,
  });
}

/** 라이브 장면 → 비트맵 Blob (PNG 등) */
export async function sceneToBlob(
  api: SceneApi,
  opts: { mimeType?: string; scale?: number } = {},
): Promise<Blob> {
  const { exportToBlob } = await import("@excalidraw/excalidraw");
  const elements = getElementsOrThrow(api);
  const scale = opts.scale ?? 2;

  return exportToBlob({
    elements,
    appState: {
      ...api.getAppState(),
      exportBackground: true,
      exportWithDarkMode: false,
    },
    files: api.getFiles(),
    mimeType: opts.mimeType ?? "image/png",
    quality: 1,
    getDimensions: (width: number, height: number) => ({
      width: width * scale,
      height: height * scale,
      scale,
    }),
  });
}

// ── 공통 다운로드 유틸 ──────────────────────────────

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
