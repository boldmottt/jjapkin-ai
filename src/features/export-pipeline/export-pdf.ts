/**
 * PDF 내보내기 (jsPDF)
 *
 * Excalidraw 공식 exportToBlob로 장면을 고해상도 PNG로 렌더링한 뒤
 * 종횡비를 유지해 A4 가로 PDF에 배치한다.
 */

import jsPDF from "jspdf";
import { sceneToBlob, blobToDataUrl, type SceneApi } from "./export-scene";

interface PdfExportOptions {
  api: SceneApi;
  filename?: string;
  title?: string;
}

export async function exportToPdf(opts: PdfExportOptions): Promise<void> {
  const { api, filename = "diagram", title = "Diagram" } = opts;

  const blob = await sceneToBlob(api, { mimeType: "image/png", scale: 2 });
  const dataUrl = await blobToDataUrl(blob);
  const { width: imgW, height: imgH } = await imageSize(dataUrl);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 제목
  pdf.setFontSize(16);
  pdf.text(title, 10, 12);

  // 제목 아래 영역에 종횡비 유지하며 배치
  const maxW = pageWidth - 20;
  const maxH = pageHeight - 25;
  const aspect = imgW / imgH;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  const x = (pageWidth - w) / 2;

  pdf.addImage(dataUrl, "PNG", x, 18, w, h);
  pdf.save(`${filename}.pdf`);
}

function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}
