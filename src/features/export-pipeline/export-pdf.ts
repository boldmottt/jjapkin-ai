/**
 * PDF 내보내기 (jsPDF)
 *
 * 현재 Excalidraw 캔버스를 PDF로 저장
 */

import { toPng } from "html-to-image";
import jsPDF from "jspdf";

interface PdfExportOptions {
  filename?: string;
  title?: string;
}

export async function exportToPdf(opts: PdfExportOptions = {}): Promise<void> {
  const { filename = "diagram", title = "Diagram" } = opts;

  const element = document.querySelector(".excalidraw-wrapper") as HTMLElement;
  if (!element) throw new Error("캔버스를 찾을 수 없습니다");

  // 캔버스를 PNG로 먼저 렌더링
  const dataUrl = await toPng(element, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
  });

  // A4 가로 (landscape)
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 제목
  pdf.setFontSize(16);
  pdf.text(title, 10, 10);

  // 이미지 (제목 아래)
  const imgWidth = pageWidth - 20;
  const imgHeight = pageHeight - 25;
  pdf.addImage(dataUrl, "PNG", 10, 15, imgWidth, imgHeight);

  pdf.save(`${filename}.pdf`);
}
