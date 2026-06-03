/**
 * 테마/스타일 프리셋
 *
 * 팔레트·폰트·라운드니스·획을 한 묶음으로 정의하고, 장면 요소에 1클릭으로
 * 일괄 적용한다(순수 변환). 도형은 팔레트를 순환 적용, 텍스트/화살표는 테마
 * 색을 따른다.
 */
import type { SceneElement } from "@/lib/scene/types";
import { isText, isArrow } from "@/lib/scene/geometry";

export interface Theme {
  id: string;
  label: string;
  /** 도형 배경 팔레트(등장 순서로 순환) */
  palette: string[];
  stroke: string; // 도형 테두리
  textColor: string; // 텍스트 색
  arrowColor: string; // 화살표 색
  fontFamily: number; // 1=손글씨, 2=일반, 3=코드
  rounded: boolean; // 사각형 둥근 모서리
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";
  /** 손그림 거칠기 (0=깔끔, 1=손그림) */
  roughness: number;
}

export const THEMES: Theme[] = [
  {
    id: "corporate",
    label: "코퍼레이트",
    palette: ["#DBEAFE", "#BFDBFE", "#E0E7FF", "#CFFAFE"],
    stroke: "#1E3A8A",
    textColor: "#1E293B",
    arrowColor: "#64748B",
    fontFamily: 2,
    rounded: true,
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0,
  },
  {
    id: "playful",
    label: "플레이풀",
    palette: ["#FEF08A", "#FDBA74", "#FCA5A5", "#A7F3D0", "#C4B5FD"],
    stroke: "#7C2D12",
    textColor: "#1F2937",
    arrowColor: "#9333EA",
    fontFamily: 1,
    rounded: true,
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
  },
  {
    id: "mono",
    label: "모노",
    palette: ["#F3F4F6", "#E5E7EB", "#D1D5DB"],
    stroke: "#111827",
    textColor: "#111827",
    arrowColor: "#374151",
    fontFamily: 3,
    rounded: false,
    strokeWidth: 1.5,
    strokeStyle: "solid",
    roughness: 0,
  },
  {
    id: "pastel",
    label: "파스텔",
    palette: ["#FBCFE8", "#DDD6FE", "#BFDBFE", "#BBF7D0", "#FED7AA"],
    stroke: "#6B7280",
    textColor: "#374151",
    arrowColor: "#9CA3AF",
    fontFamily: 2,
    rounded: true,
    strokeWidth: 1.5,
    strokeStyle: "solid",
    roughness: 0,
  },
  {
    id: "dark",
    label: "다크",
    palette: ["#334155", "#475569", "#1E293B", "#3F3F46"],
    stroke: "#0F172A",
    textColor: "#F8FAFC",
    arrowColor: "#94A3B8",
    fontFamily: 2,
    rounded: true,
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0,
  },
];

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

const SHAPE_TYPES = new Set(["rectangle", "ellipse", "diamond"]);

/**
 * 장면 요소들에 테마를 적용한 새 배열을 반환(순수). image 요소는 건드리지 않는다.
 */
export function applyTheme(
  elements: readonly SceneElement[],
  themeId: string,
): SceneElement[] {
  const theme = getTheme(themeId);
  if (!theme) return [...elements];

  let shapeIdx = 0;
  return elements.map((e) => {
    const type = String(e.type);
    if (SHAPE_TYPES.has(type)) {
      const bg = theme.palette[shapeIdx % theme.palette.length];
      shapeIdx++;
      return {
        ...e,
        backgroundColor: bg,
        strokeColor: theme.stroke,
        strokeWidth: theme.strokeWidth,
        strokeStyle: theme.strokeStyle,
        roughness: theme.roughness,
        roundness:
          type === "rectangle"
            ? theme.rounded
              ? { type: 3 }
              : null
            : (e.roundness ?? null),
      };
    }
    if (isText(e)) {
      return { ...e, strokeColor: theme.textColor, fontFamily: theme.fontFamily };
    }
    if (isArrow(e)) {
      return {
        ...e,
        strokeColor: theme.arrowColor,
        strokeWidth: theme.strokeWidth,
        roughness: theme.roughness,
      };
    }
    return e;
  });
}
