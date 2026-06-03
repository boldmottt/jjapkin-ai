/**
 * 벡터 PDF 내보내기 (jsPDF + svg2pdf.js)
 *
 * 기존 export-pdf.ts는 장면을 PNG로 래스터화해 PDF에 붙이므로 확대 시
 * 픽셀이 깨지고 Illustrator 등에서 편집이 불가능하다. 이 모듈은 Excalidraw
 * 장면을 실제 SVG로 추출(sceneToSvg)한 뒤, svg2pdf.js로 PDF에 "벡터 그대로"
 * 그려 넣어 무한 확대·재편집이 가능한 PDF를 만든다.
 */

import jsPDF from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { sceneToSvg, type SceneApi } from "./export-scene";
import { registerKoreanFont, applyKoreanFontToSvg } from "./korean-font";

interface VectorPdfExportOptions {
  api: SceneApi;
  filename?: string;
  title?: string;
}

// SVG 크기를 읽지 못했을 때 사용할 안전한 기본 크기(px)
const FALLBACK_WIDTH = 800;
const FALLBACK_HEIGHT = 600;
// 제목을 얹을 상단 여백(pt). pt와 px를 1:1로 다뤄도 다이어그램 품질엔 영향 없음.
const TITLE_MARGIN = 32;

/**
 * SVG 요소에서 다이어그램의 실제 픽셀 크기를 읽는다.
 * width/height 속성 → viewBox 파싱 → 기본값 순으로 폴백한다.
 */
function readSvgSize(svg: SVGSVGElement): { width: number; height: number } {
  const parseLen = (v: string | null): number => {
    if (!v) return NaN;
    // "800", "800px" 등에서 숫자만 추출
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  };

  let width = parseLen(svg.getAttribute("width"));
  let height = parseLen(svg.getAttribute("height"));

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    const viewBox = svg.getAttribute("viewBox");
    if (viewBox) {
      // "minX minY width height"
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts.every((p) => Number.isFinite(p))) {
        width = parts[2];
        height = parts[3];
      }
    }
  }

  if (!Number.isFinite(width) || width <= 0) width = FALLBACK_WIDTH;
  if (!Number.isFinite(height) || height <= 0) height = FALLBACK_HEIGHT;

  return { width, height };
}

/**
 * Excalidraw 장면을 벡터 PDF로 내보낸다.
 * 페이지 크기는 다이어그램 크기에 맞춘 커스텀 포맷을 사용한다.
 */
export async function exportToVectorPdf(
  opts: VectorPdfExportOptions,
): Promise<void> {
  const { api, filename = "diagram", title = "Diagram" } = opts;

  let svg: SVGSVGElement;
  try {
    svg = await sceneToSvg(api, { background: true });
  } catch (err) {
    // sceneToSvg는 "내보낼 다이어그램이 없습니다" 등 의미 있는 메시지를 던진다
    throw err instanceof Error
      ? err
      : new Error("벡터 PDF용 SVG를 만드는 데 실패했습니다.");
  }

  const { width, height } = readSvgSize(svg);
  const pageWidth = width;
  const pageHeight = height + TITLE_MARGIN;
  const orientation = pageWidth >= pageHeight ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit: "pt",
    // 커스텀 포맷: 다이어그램 크기에 정확히 맞춰 여백 없이 담는다
    format: [pageWidth, pageHeight],
  });

  // 한글 폰트 임베딩: 제목/도형 텍스트의 한글이 깨지지 않도록 등록하고,
  // SVG 텍스트의 font-family를 한글 폰트로 덮어쓴다.
  const fontFamily = await registerKoreanFont(pdf);
  applyKoreanFontToSvg(svg);

  // 제목
  pdf.setFont(fontFamily, "normal");
  pdf.setFontSize(16);
  pdf.text(title, 16, 22);

  try {
    // SVG를 벡터 그대로 PDF에 렌더링 (제목 영역만큼 아래로 내림)
    await svg2pdf(svg, pdf, {
      x: 0,
      y: TITLE_MARGIN,
      width,
      height,
    });
  } catch (err) {
    console.error("[export-pdf-vector] svg2pdf 변환 실패:", err);
    throw new Error(
      "벡터 PDF 변환에 실패했습니다. 일부 복잡한 도형은 지원되지 않을 수 있습니다.",
    );
  }

  pdf.save(`${filename}.pdf`);
}
