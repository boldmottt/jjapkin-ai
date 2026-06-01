/**
 * PPT 내보내기 (pptxgenjs)
 *
 * Excalidraw 요소를 파워포인트 슬라이드로 변환
 */

import type { ExcalidrawElement } from "@/features/canvas-editor/ExcalidrawWrapper";

interface PptExportOptions {
  elements?: ExcalidrawElement[];
  filename?: string;
  title?: string;
}

export async function exportToPptx(opts: PptExportOptions = {}): Promise<void> {
  const { filename = "diagram", title = "Diagram" } = opts;

  // 동적 import (번들 크기 절약)
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  const slide = pptx.addSlide();
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: "1F2937",
  });

  // 각 Excalidraw 요소를 PPT 도형으로 변환
  if (opts.elements) {
    for (const el of opts.elements) {
      const x = pxToInch(el.x);
      const y = pxToInch(el.y) + 1; // 제목 공간 offset
      const w = pxToInch(el.width);
      const h = pxToInch(el.height);

      switch (el.type) {
        case "rectangle":
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w,
            h,
            fill: { color: (el.backgroundColor as string) ?? "FFFFFF" },
            line: {
              color: (el.strokeColor as string) ?? "1F2937",
              width: ((el.strokeWidth as number) ?? 2) * 0.5,
            },
            rectRadius: 0.1,
          });
          break;

        case "text":
          slide.addText((el.text as string) ?? "", {
            x,
            y,
            w,
            h,
            fontSize: (el.fontSize as number) ?? 16,
            color: (el.strokeColor as string) ?? "1F2937",
            align: "center",
            valign: "middle",
          });
          break;

        case "arrow":
          // PPT에서는 선으로 변환
          slide.addShape(pptx.ShapeType.line, {
            x,
            y,
            w,
            h,
            line: {
              color: (el.strokeColor as string) ?? "6B7280",
              width: ((el.strokeWidth as number) ?? 2) * 0.5,
            },
          });
          break;

        default:
          // 기타 요소는 직사각형으로 대체
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w,
            h,
            fill: { color: "EEEEEE" },
            line: { color: "CCCCCC", width: 0.5 },
          });
      }
    }
  }

  await pptx.writeFile({ fileName: `${filename}.pptx` });
}

function pxToInch(px: number): number {
  return px / 96; // 96 DPI 기준
}
