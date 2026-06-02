/**
 * PNG 내보내기
 *
 * Excalidraw 공식 exportToBlob로 라이브 장면을 PNG로 렌더링한다.
 */

import { sceneToBlob, downloadBlob, type SceneApi } from "./export-scene";

interface PngExportOptions {
  api: SceneApi;
  /** 파일명 (확장자 제외) */
  filename?: string;
  /** 배율 (기본: 2x 레티나) */
  scale?: number;
}

export async function exportToPng(opts: PngExportOptions): Promise<void> {
  const { api, filename = "diagram", scale = 2 } = opts;
  const blob = await sceneToBlob(api, { mimeType: "image/png", scale });
  downloadBlob(blob, `${filename}.png`);
}

/** PNG를 클립보드에 복사 */
export async function copyPngToClipboard(opts: {
  api: SceneApi;
  scale?: number;
}): Promise<void> {
  const blob = await sceneToBlob(opts.api, {
    mimeType: "image/png",
    scale: opts.scale ?? 2,
  });
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
