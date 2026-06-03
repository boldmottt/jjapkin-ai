/**
 * 색상 유틸 — 대비 자동 보정 + 팔레트 하모니 생성
 *
 * - idealTextColor: 배경 밝기(상대 휘도)로 흑/백 텍스트를 자동 선택해 가독성 확보.
 * - harmonize: 시드 색 하나에서 HSL 회전으로 조화로운 팔레트를 생성.
 */

/** "#RRGGBB" → [r,g,b] (0-255). 실패 시 null */
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** sRGB 상대 휘도 (WCAG) 0~1 */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 1; // 알 수 없으면 밝다고 가정(어두운 텍스트)
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const DARK_TEXT = "#1F2937";
const LIGHT_TEXT = "#F8FAFC";

/** 배경 색 위에서 가독성이 좋은 텍스트 색(흑/백)을 반환 */
export function idealTextColor(bg: string | undefined): string {
  if (!bg || bg === "transparent") return DARK_TEXT;
  return relativeLuminance(bg) > 0.5 ? DARK_TEXT : LIGHT_TEXT;
}

// ── HSL 변환 ────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/**
 * 시드 색에서 조화로운 팔레트 생성(색상환을 균등 회전, 채도/명도 유지).
 * 시드 파싱 실패 시 기본 시드(#3B82F6) 사용.
 */
export function harmonize(seed: string, count: number): string[] {
  const rgb = parseHex(seed) ?? parseHex("#3B82F6")!;
  const [h, s, l] = rgbToHsl(...rgb);
  const sat = Math.max(0.45, Math.min(0.75, s || 0.6));
  const lig = Math.max(0.6, Math.min(0.82, l || 0.7));
  const out: string[] = [];
  for (let i = 0; i < Math.max(1, count); i++) {
    const hue = h + (360 / Math.max(1, count)) * i;
    out.push(toHex(...hslToRgb(hue, sat, lig)));
  }
  return out;
}
