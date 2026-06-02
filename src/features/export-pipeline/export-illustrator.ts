/**
 * Adobe Illustrator 호환 내보내기
 *
 * 디자이너가 Illustrator에서 바로 열어서 편집할 수 있는 형식으로 내보낸다.
 * 라이브 Excalidraw 장면을 공식 exportToSvg로 추출한 뒤 가공한다.
 *
 * 지원 형식:
 *  - .ai.svg  — Illustrator 최적화 SVG (레이어 / 네임스페이스 포함)
 *  - .ai.pdf  — Illustrator에서 열 수 있는 PDF (A3, 고해상도 래스터)
 *  - .eps     — Encapsulated PostScript (레거시, SVG 데이터 임베드)
 */

import {
  sceneToSvg,
  sceneToBlob,
  blobToDataUrl,
  downloadBlob,
  type SceneApi,
} from "./export-scene";

// ─────────────────────────────────────────────────────
// 1. Illustrator SVG (최적화)
// ─────────────────────────────────────────────────────

interface IllustratorSvgOptions {
  api: SceneApi;
  filename?: string;
  title?: string;
  artboardColor?: string;
}

export async function exportToIllustratorSvg(
  opts: IllustratorSvgOptions,
): Promise<void> {
  const { api, filename = "diagram", title = "Diagram", artboardColor = "#ffffff" } = opts;

  const svg = await sceneToSvg(api, { background: true });

  // Illustrator 호환 네임스페이스
  svg.setAttribute("xmlns:ai", "http://ns.adobe.com/AdobeIllustrator/10.0/");
  svg.setAttribute("xmlns:graph", "http://ns.adobe.com/Graphs/1.0/");
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // 아트보드 배경
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", "100%");
  rect.setAttribute("height", "100%");
  rect.setAttribute("fill", artboardColor);
  rect.setAttribute("ai:layer", "background");
  svg.insertBefore(rect, svg.firstChild);

  // 레이어 메타데이터
  svg.insertBefore(buildIllustratorMetadata(title), svg.firstChild);

  // 각 그룹을 AI 레이어로 매핑
  svg.querySelectorAll("g").forEach((g, i) => {
    g.setAttribute("ai:layer", `layer-${i + 1}`);
    g.setAttribute("id", `jjapkin-layer-${i + 1}`);
  });

  const svgText = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `${filename}.ai.svg`);
}

// ─────────────────────────────────────────────────────
// 2. PDF (Illustrator에서 열기, A3 고해상도)
// ─────────────────────────────────────────────────────

interface IllustratorPdfOptions {
  api: SceneApi;
  filename?: string;
  title?: string;
}

export async function exportToIllustratorPdf(
  opts: IllustratorPdfOptions,
): Promise<void> {
  const { api, filename = "diagram", title = "Diagram" } = opts;

  const jsPDF = (await import("jspdf")).default;

  // 벡터에 가까운 품질을 위해 고배율 래스터 + A3 아트보드
  const blob = await sceneToBlob(api, { mimeType: "image/png", scale: 3 });
  const dataUrl = await blobToDataUrl(blob);
  const { width: imgW, height: imgH } = await imageSize(dataUrl);

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(title, 30, 30);

  const maxW = pageWidth - 60;
  const maxH = pageHeight - 80;
  const aspect = imgW / imgH;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  const x = (pageWidth - w) / 2;

  pdf.addImage(dataUrl, "PNG", x, 50, w, h);
  pdf.setProperties({
    title,
    creator: "JJapkin AI - Adobe Illustrator Compatible",
  });

  pdf.save(`${filename}.ai.pdf`);
}

// ─────────────────────────────────────────────────────
// 3. EPS (Encapsulated PostScript)
// ─────────────────────────────────────────────────────

interface EpsOptions {
  api: SceneApi;
  filename?: string;
  title?: string;
}

export async function exportToEps(opts: EpsOptions): Promise<void> {
  const { api, filename = "diagram", title = "Diagram" } = opts;

  const svg = await sceneToSvg(api, { background: true });
  const svgText = new XMLSerializer().serializeToString(svg);
  const epsContent = svgToEps(svgText, title);

  const blob = new Blob([epsContent], { type: "application/postscript" });
  downloadBlob(blob, `${filename}.eps`);
}

// ─────────────────────────────────────────────────────
// 유틸리티
// ─────────────────────────────────────────────────────

function buildIllustratorMetadata(title: string): SVGElement {
  const metadata = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "metadata",
  );
  metadata.innerHTML = `
    <ai:Document>
      <ai:Title>${escapeXml(title)}</ai:Title>
      <ai:CreationDate>${new Date().toISOString()}</ai:CreationDate>
      <ai:Creator>JJapkin AI</ai:Creator>
      <ai:Description>Adobe Illustrator 호환 벡터 다이어그램</ai:Description>
    </ai:Document>
  `;
  return metadata;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * SVG → EPS 변환 (간소화)
 * 실제 프로덕션에서는 전용 라이브러리 사용 권장
 */
function svgToEps(svg: string, title: string): string {
  const header = [
    "%!PS-Adobe-3.0 EPSF-3.0",
    `%%Title: ${title}`,
    "%%Creator: JJapkin AI",
    `%%CreationDate: ${new Date().toISOString()}`,
    "%%LanguageLevel: 3",
    "%%BoundingBox: 0 0 800 600",
    "%%DocumentData: Clean7Bit",
    "%%EndComments",
    "",
    "%%BeginProlog",
    "/ai { } def",
    "%%EndProlog",
    "",
  ].join("\n");

  const note =
    "%% Illustrator에서 열기: File > Open > 이 EPS 파일 선택\n" +
    "%% 더 나은 편집을 위해 .ai.svg 또는 .ai.pdf 사용을 권장합니다.\n" +
    "%% SVG 데이터가 포함되어 있습니다.\n\n" +
    svg.replace(/</g, "%%<").replace(/>/g, ">%%");

  return header + note + "\n%%EOF\n";
}
