/**
 * 아이콘 → SVG dataURL 변환 (오프라인 Iconify/lucide)
 *
 * Excalidraw는 임의 SVG 패스를 네이티브 도형으로 렌더링하지 못하므로,
 * 아이콘을 image 요소의 dataURL로 임베드한다. 아이콘 데이터는 오프라인
 * 패키지(@iconify-json/lucide)에서 가져와 네트워크 의존이 없다.
 */
import { getIconData, iconToSVG } from "@iconify/utils";
import lucideSet from "@iconify-json/lucide/icons.json";

/** iconify id("lucide:rocket") 또는 단순 이름("rocket")에서 lucide 아이콘명 추출 */
function iconName(id: string): string {
  const trimmed = id.trim();
  return trimmed.includes(":") ? trimmed.split(":").pop()!.trim() : trimmed;
}

function toBase64(s: string): string {
  if (typeof btoa !== "undefined") {
    // 유니코드 안전 인코딩
    return btoa(unescape(encodeURIComponent(s)));
  }
  // node 폴백
  return Buffer.from(s, "utf-8").toString("base64");
}

/** 해당 아이콘 id가 존재하는지 */
export function hasIcon(id: string): boolean {
  return getIconData(lucideSet as never, iconName(id)) != null;
}

/**
 * 아이콘을 SVG dataURL로 변환. 없으면 null.
 * @param color stroke 색(lucide는 currentColor 기반)
 */
export function iconToDataUrl(
  id: string,
  color = "#1F2937",
  size = 24,
): string | null {
  const data = getIconData(lucideSet as never, iconName(id));
  if (!data) return null;

  const { attributes, body } = iconToSVG(data, {
    height: String(size),
    width: String(size),
  });
  // lucide는 stroke="currentColor" → 지정 색으로 치환
  const colored = body.replace(/currentColor/g, color);
  const attrs = Object.entries(attributes)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${colored}</svg>`;

  return `data:image/svg+xml;base64,${toBase64(svg)}`;
}
