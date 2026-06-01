/**
 * PNG 내보내기
 *
 * Excalidraw 캔버스 또는 현재 DOM 요소를 PNG로 다운로드
 */

import { toPng } from "html-to-image";

interface PngExportOptions {
  /** 대상 DOM 요소 (기본: Excalidraw 캔버스) */
  element?: HTMLElement;
  /** 파일명 (확장자 제외) */
  filename?: string;
  /** 배경색 (기본: 흰색, null이면 투명) */
  backgroundColor?: string | null;
  /** 배율 (기본: 2x 레티나) */
  scale?: number;
}

export async function exportToPng(opts: PngExportOptions = {}): Promise<void> {
  const {
    filename = "diagram",
    backgroundColor = "#ffffff",
    scale = 2,
  } = opts;

  // Excalidraw 캔버스를 자동으로 찾음
  const element =
    opts.element ??
    (document.querySelector(".excalidraw-wrapper canvas") as HTMLElement) ??
    (document.querySelector(".excalidraw-wrapper svg") as HTMLElement) ??
    (document.querySelector(".excalidraw-wrapper") as HTMLElement);

  if (!element) {
    throw new Error("내보낼 캔버스를 찾을 수 없습니다");
  }

  const dataUrl = await toPng(element, {
    backgroundColor: backgroundColor ?? undefined,
    pixelRatio: scale,
    cacheBust: true,
  });

  downloadDataUrl(dataUrl, `${filename}.png`);
}

// ── 유틸 ───────────────────────────────────────────

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** PNG를 클립보드에 복사 */
export async function copyPngToClipboard(opts: PngExportOptions = {}): Promise<void> {
  const element =
    opts.element ??
    (document.querySelector(".excalidraw-wrapper") as HTMLElement);

  if (!element) throw new Error("캔버스를 찾을 수 없습니다");

  const blob = await toPng(element, {
    backgroundColor: opts.backgroundColor ?? "#ffffff",
    pixelRatio: opts.scale ?? 2,
    cacheBust: true,
  }).then((dataUrl) => dataUrlToBlob(dataUrl));

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob }),
  ]);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const bytes = atob(base64);
  const buffer = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) view[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}
