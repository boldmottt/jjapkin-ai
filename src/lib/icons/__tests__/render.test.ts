import { describe, it, expect } from "vitest";
import { iconToDataUrl, hasIcon } from "@/lib/icons/render";

describe("아이콘 렌더", () => {
  it("존재하는 아이콘은 SVG dataURL 반환", () => {
    const url = iconToDataUrl("lucide:rocket");
    expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
    const svg = Buffer.from(url!.split(",")[1], "base64").toString("utf-8");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("접두사 없는 이름도 허용", () => {
    expect(iconToDataUrl("rocket")).not.toBeNull();
  });

  it("색상이 currentColor를 치환", () => {
    const url = iconToDataUrl("rocket", "#FF0000")!;
    const svg = Buffer.from(url.split(",")[1], "base64").toString("utf-8");
    expect(svg).toContain("#FF0000");
    expect(svg).not.toContain("currentColor");
  });

  it("없는 아이콘은 null", () => {
    expect(iconToDataUrl("lucide:__definitely_not_an_icon__")).toBeNull();
    expect(hasIcon("__nope__")).toBe(false);
    expect(hasIcon("rocket")).toBe(true);
  });
});
