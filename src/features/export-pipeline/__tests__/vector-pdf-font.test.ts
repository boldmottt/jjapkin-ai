/**
 * 벡터 PDF 한글 폰트 임베딩 회귀 테스트
 *
 * 앞서 수동(헤드리스 스크립트)으로 검증했던 "한글 SVG → 벡터 PDF에 폰트
 * 임베딩"을 자동화한다. 서브셋 폰트가 깨지거나 svg2pdf 경로가 회귀하면
 * 여기서 잡힌다.
 *
 * jsdom에는 레이아웃 엔진이 없어 svg2pdf가 쓰는 canvas 측정/getBBox가 없다
 * (브라우저엔 존재). 검증 목적상 최소 스텁으로 대체한다.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import {
  registerKoreanFont,
  applyKoreanFontToSvg,
  KOREAN_FONT_FAMILY,
} from "../korean-font";

const FONT_PATH = resolve(process.cwd(), "public/fonts/NotoSansKR-Regular.ttf");

beforeAll(() => {
  // jsdom 미구현 레이아웃 API 스텁 (브라우저엔 존재)
  const proto = window.SVGElement.prototype as unknown as {
    getBBox?: () => { x: number; y: number; width: number; height: number };
    getComputedTextLength?: () => number;
  };
  proto.getBBox = function (this: SVGElement) {
    const n = (a: string) =>
      parseFloat((this as SVGElement).getAttribute(a) || "0") || 0;
    return {
      x: n("x"),
      y: n("y"),
      width: n("width") || 100,
      height: n("height") || 20,
    };
  };
  proto.getComputedTextLength = function (this: SVGElement) {
    return (this.textContent || "").length * 8;
  };

  // registerKoreanFont는 /fonts에서 fetch → 테스트에선 파일을 직접 읽어 mock
  const buf = readFileSync(FONT_PATH);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => ab,
    })),
  );
});

function makeKoreanSvg(): SVGSVGElement {
  const W = 400;
  const H = 160;
  const container = document.createElement("div");
  container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>
    <rect x="40" y="50" width="160" height="60" fill="#a5d8ff" stroke="#1971c2"/>
    <text x="50" y="85" font-size="18">주문 시작 짭짤 ABC</text>
  </svg>`;
  return container.querySelector("svg") as unknown as SVGSVGElement;
}

describe("벡터 PDF 한글 폰트 임베딩", () => {
  it("서브셋 폰트가 유효하고 충분한 크기", () => {
    const buf = readFileSync(FONT_PATH);
    expect(buf.byteLength).toBeGreaterThan(500_000); // 한글 서브셋 ≈ 2.7MB
    // 유효한 sfnt 매직: TrueType(0x00010000) 또는 OTTO/true/ttcf
    const magic = buf.subarray(0, 4).toString("hex");
    expect(["00010000", "4f54544f", "74727565", "74746366"]).toContain(magic);
  });

  it("applyKoreanFontToSvg가 모든 text의 font-family를 한글 폰트로 지정", () => {
    const svg = makeKoreanSvg();
    applyKoreanFontToSvg(svg);
    const texts = svg.querySelectorAll("text");
    expect(texts.length).toBeGreaterThan(0);
    texts.forEach((t) => {
      expect(t.getAttribute("font-family")).toBe(KOREAN_FONT_FAMILY);
    });
  });

  it("registerKoreanFont + svg2pdf로 한글이 PDF에 폰트 임베딩됨", async () => {
    const W = 400;
    const H = 160;
    const pdf = new jsPDF({ unit: "pt", format: [W, H] });

    const family = await registerKoreanFont(pdf);
    expect(family).toBe(KOREAN_FONT_FAMILY);
    // 모든 스타일이 등록되어 svg2pdf가 기본 폰트로 폴백하지 않음
    expect(pdf.getFontList()[KOREAN_FONT_FAMILY]).toEqual(
      expect.arrayContaining(["normal", "bold", "italic", "bolditalic"]),
    );

    const svg = makeKoreanSvg();
    applyKoreanFontToSvg(svg);
    await svg2pdf(svg, pdf, { x: 0, y: 0, width: W, height: H });

    const bytes = Buffer.from(pdf.output("arraybuffer"));
    const latin = bytes.toString("latin1");
    expect(bytes.byteLength).toBeGreaterThan(5_000);
    expect(latin).toContain("FontFile2"); // TrueType 폰트 임베딩
    expect(latin).toContain("Type0"); // CID 컴포지트 폰트(한글)
  });
});
