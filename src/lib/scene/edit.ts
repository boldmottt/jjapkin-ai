/**
 * 선택 요소에 대한 편집 op 적용 (순수)
 *
 * AI(또는 UI)가 내린 "제한된 편집 op"를 선택 요소에 결정적으로 적용한다.
 * 실제 변형은 element-props의 순수 함수를 재사용하므로 안전하다.
 */
import type { SceneElement } from "./types";
import {
  applyProps,
  flipElements,
  alignElements,
  distributeElements,
  createShadows,
  type AlignMode,
} from "@/lib/element-props";
import { idealTextColor } from "./color";

export type EditOp =
  | { op: "recolor"; color: string }
  | { op: "recolorStroke"; color: string }
  | { op: "resize"; width?: number; height?: number }
  | { op: "opacity"; value: number }
  | { op: "strokeWidth"; value: number }
  | { op: "fillStyle"; value: "solid" | "hachure" | "cross-hatch" | "zigzag" }
  | { op: "roundness"; rounded: boolean }
  | { op: "emphasize" }
  | { op: "relabel"; text: string }
  | { op: "align"; mode: AlignMode }
  | { op: "distribute"; axis: "horizontal" | "vertical" }
  | { op: "flip"; axis: "horizontal" | "vertical" }
  | { op: "shadow" };

const HIGHLIGHT = "#F59E0B";

/** 선택 요소(및 그에 바운드된 텍스트)에 라벨을 재설정 */
function relabel(
  elements: SceneElement[],
  ids: ReadonlySet<string>,
  text: string,
): SceneElement[] {
  return elements.map((e) => {
    const isSelectedText = ids.has(e.id) && e.type === "text";
    const isBoundText =
      e.type === "text" &&
      typeof e.containerId === "string" &&
      ids.has(e.containerId);
    return isSelectedText || isBoundText ? { ...e, text } : e;
  });
}

/** 하나의 op를 적용 */
function applyOne(
  elements: SceneElement[],
  ids: ReadonlySet<string>,
  op: EditOp,
): SceneElement[] {
  switch (op.op) {
    case "recolor": {
      // 배경색 변경 + 바운드 텍스트 대비 자동 보정
      const tc = idealTextColor(op.color);
      const next = applyProps(elements, ids, { backgroundColor: op.color });
      return next.map((e) =>
        e.type === "text" &&
        typeof e.containerId === "string" &&
        ids.has(e.containerId)
          ? { ...e, strokeColor: tc }
          : e,
      );
    }
    case "recolorStroke":
      return applyProps(elements, ids, { strokeColor: op.color });
    case "resize":
      return applyProps(elements, ids, {
        ...(op.width != null ? { width: op.width } : {}),
        ...(op.height != null ? { height: op.height } : {}),
      });
    case "opacity":
      return applyProps(elements, ids, { opacity: op.value });
    case "strokeWidth":
      return applyProps(elements, ids, { strokeWidth: op.value });
    case "fillStyle":
      return applyProps(elements, ids, { fillStyle: op.value });
    case "roundness":
      return applyProps(elements, ids, {
        roundness: op.rounded ? { type: 3 } : null,
      });
    case "emphasize":
      return applyProps(elements, ids, {
        strokeColor: HIGHLIGHT,
        strokeWidth: 4,
      });
    case "relabel":
      return relabel(elements, ids, op.text);
    case "align":
      return alignElements(elements, ids, op.mode);
    case "distribute":
      return distributeElements(elements, ids, op.axis);
    case "flip":
      return flipElements(elements, ids, op.axis);
    case "shadow":
      return createShadows(elements, ids);
    default:
      return elements;
  }
}

/** op 목록을 순서대로 적용한 새 요소 배열 반환 */
export function applyEditOps(
  elements: readonly SceneElement[],
  ids: ReadonlySet<string>,
  ops: readonly EditOp[],
): SceneElement[] {
  let acc = [...elements];
  for (const op of ops) acc = applyOne(acc, ids, op);
  return acc;
}
