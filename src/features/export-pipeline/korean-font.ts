/**
 * 벡터 PDF용 한글 폰트 임베딩 헬퍼
 *
 * svg2pdf.js는 SVG 텍스트를 jsPDF에 등록된 폰트로 그린다. jsPDF 기본 폰트
 * (Helvetica/Times/Courier)는 라틴 전용이라 한글이 깨진다. 이 모듈은 서브셋된
 * Noto Sans KR(public/fonts)을 런타임에 한 번만 받아 base64로 캐시하고,
 * 주어진 jsPDF 인스턴스에 모든 스타일로 등록한다.
 *
 * - 폰트는 벡터 PDF 내보내기 시점에만 fetch되므로 JS 번들에는 포함되지 않는다.
 * - 모든 스타일(normal/bold/italic/bolditalic)을 같은 폰트로 등록해
 *   svg2pdf가 굵게/기울임을 요청해도 기본 폰트로 폴백하지 않도록 한다.
 */

import type jsPDF from "jspdf";

/** SVG 텍스트 및 PDF 제목에 사용할 폰트 패밀리 이름 */
export const KOREAN_FONT_FAMILY = "NotoSansKR";

const FONT_URL = "/fonts/NotoSansKR-Regular.ttf";
const VFS_FILENAME = "NotoSansKR-Regular.ttf";
const FONT_STYLES = ["normal", "bold", "italic", "bolditalic"] as const;

// 모듈 수명 동안 base64를 캐시(같은 세션에서 재요청 방지)
let cachedBase64: string | null = null;
let inflight: Promise<string> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // 큰 폰트도 콜스택 초과 없이 변환하도록 청크 단위로 처리
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + CHUNK)),
    );
  }
  return btoa(binary);
}

async function loadFontBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(FONT_URL);
    if (!res.ok) {
      throw new Error(
        `한글 폰트를 불러오지 못했습니다 (${res.status}). 벡터 PDF의 한글이 깨질 수 있습니다.`,
      );
    }
    const buf = await res.arrayBuffer();
    cachedBase64 = arrayBufferToBase64(buf);
    return cachedBase64;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/**
 * 주어진 jsPDF 인스턴스에 한글 폰트를 등록한다.
 * @returns 등록된 폰트 패밀리 이름(KOREAN_FONT_FAMILY)
 */
export async function registerKoreanFont(pdf: jsPDF): Promise<string> {
  const base64 = await loadFontBase64();
  pdf.addFileToVFS(VFS_FILENAME, base64);
  for (const style of FONT_STYLES) {
    pdf.addFont(VFS_FILENAME, KOREAN_FONT_FAMILY, style);
  }
  return KOREAN_FONT_FAMILY;
}

/**
 * SVG 내 모든 텍스트의 font-family를 한글 폰트로 강제 지정한다.
 * (Excalidraw 기본 폰트는 한글 글리프가 없어 그대로 두면 폴백되어 깨진다)
 */
export function applyKoreanFontToSvg(svg: SVGSVGElement): void {
  svg.querySelectorAll("text, tspan").forEach((node) => {
    const el = node as SVGElement;
    el.setAttribute("font-family", KOREAN_FONT_FAMILY);
    el.style.fontFamily = KOREAN_FONT_FAMILY;
  });
}
