/**
 * PPT 내보내기 (pptxgenjs)
 *
 * 라이브 Excalidraw 장면 요소를 파워포인트 슬라이드의 개별 도형으로 변환한다.
 * (사용자 편집 결과 반영)
 */

import { type SceneApi } from "./export-scene";

interface PptExportOptions {
  api: SceneApi;
  filename?: string;
  title?: string;
}

export async function exportToPptx(opts: PptExportOptions): Promise<void> {
  const { api, filename = "diagram", title = "Diagram" } = opts;
  const elements = api.getSceneElements() as ReadonlyArray<Record<string, unknown>>;

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

  for (const el of elements) {
    const x = pxToInch(el.x as number);
    const y = pxToInch(el.y as number) + 1; // 제목 공간 offset
    const w = pxToInch((el.width as number) || 1);
    const h = pxToInch((el.height as number) || 1);

    switch (el.type) {
      case "rectangle":
        slide.addShape(pptx.ShapeType.rect, {
          x,
          y,
          w,
          h,
          fill: { color: hex(el.backgroundColor, "FFFFFF") },
          line: {
            color: hex(el.strokeColor, "1F2937"),
            width: ((el.strokeWidth as number) ?? 2) * 0.5,
          },
          rectRadius: 0.05,
        });
        break;

      case "text":
        slide.addText((el.text as string) ?? "", {
          x,
          y,
          w,
          h,
          fontSize: pxToPt((el.fontSize as number) ?? 16),
          color: hex(el.strokeColor, "1F2937"),
          align: "center",
          valign: "middle",
        });
        break;

      case "arrow":
      case "line":
        slide.addShape(pptx.ShapeType.line, {
          x,
          y,
          w,
          h,
          line: {
            color: hex(el.strokeColor, "6B7280"),
            width: ((el.strokeWidth as number) ?? 2) * 0.5,
            endArrowType: el.type === "arrow" ? "triangle" : "none",
          },
        });
        break;

      default:
        // 기타 요소는 건너뜀 (frame, freedraw 등)
        break;
    }
  }

  await pptx.writeFile({ fileName: `${filename}.pptx` });
}

function pxToInch(px: number): number {
  return px / 96; // 96 DPI 기준
}

function pxToPt(px: number): number {
  return px * 0.75; // 96px = 72pt
}

/** Excalidraw 색상("#RRGGBB" | "transparent")을 pptx hex("RRGGBB")로 */
function hex(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value === "transparent") return fallback;
  return value.replace(/^#/, "").toUpperCase();
}
