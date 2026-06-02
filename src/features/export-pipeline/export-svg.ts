/**
 * SVG 내보내기
 *
 * Excalidraw 공식 exportToSvg로 라이브 장면을 벡터 SVG로 내보낸다.
 */

import {
  sceneToSvg,
  downloadBlob,
  type SceneApi,
} from "./export-scene";

interface SvgExportOptions {
  api: SceneApi;
  filename?: string;
}

export async function exportToSvg(opts: SvgExportOptions): Promise<void> {
  const { api, filename = "diagram" } = opts;

  const svg = await sceneToSvg(api);
  const svgText = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `${filename}.svg`);
}
