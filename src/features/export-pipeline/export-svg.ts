/**
 * SVG 내보내기
 *
 * Excalidraw 캔버스의 SVG 요소를 추출해서 다운로드
 */

interface SvgExportOptions {
  filename?: string;
}

export async function exportToSvg(opts: SvgExportOptions = {}): Promise<void> {
  const { filename = "diagram" } = opts;

  // Excalidraw 캔버스의 SVG 찾기
  const svgElement = document.querySelector(".excalidraw-wrapper svg") as SVGElement;

  if (!svgElement) {
    throw new Error("SVG 요소를 찾을 수 없습니다");
  }

  // SVG 복제 (원본 보존)
  const clone = svgElement.cloneNode(true) as SVGElement;

  // 배경색 추가
  const bg = svgElement.closest("[style]")?.getAttribute("style") ?? "";
  const bgMatch = bg.match(/background(?:-color)?:\s*([^;]+)/);
  if (bgMatch) {
    clone.setAttribute("style", `background-color: ${bgMatch[1]}`);
  }

  const svgText = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = `${filename}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
