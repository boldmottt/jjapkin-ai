/**
 * 레이어 패널 로직 (순수 함수)
 *
 * Excalidraw는 "명명된 레이어"를 기본 지원하지 않으므로, 장면 요소를
 * 사람이 다루기 쉬운 "레이어 항목"으로 묶어 표현한다.
 *   - 도형 + 그 도형에 바인딩된 텍스트 → 한 항목
 *   - 같은 groupId를 공유하는 요소들 → 한 항목
 *   - 그 외 요소(화살표 등) → 각각 한 항목
 *
 * 표시/숨김은 opacity(0↔100), 잠금은 locked, 순서는 요소 배열의 z-order로 매핑.
 */

import type { SceneElement } from "@/lib/scene/types";

/** 레이어 로직이 다루는 요소 = 정규 SceneElement (별칭, 하위호환) */
export type SceneEl = SceneElement;

export interface LayerItem {
  /** 안정적 식별자 (groupId 또는 element id) */
  key: string;
  label: string;
  type: string;
  /** 이 레이어에 속한 모든 요소 id */
  elementIds: string[];
  locked: boolean;
  hidden: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  rectangle: "사각형",
  ellipse: "타원",
  diamond: "마름모",
  arrow: "화살표",
  line: "선",
  text: "텍스트",
  freedraw: "자유선",
  image: "이미지",
  frame: "프레임",
};

function typeLabel(t: string): string {
  return TYPE_LABELS[t] ?? t;
}

function lastGroupId(e: SceneEl): string | null {
  if (Array.isArray(e.groupIds) && e.groupIds.length > 0) {
    return String(e.groupIds[e.groupIds.length - 1]);
  }
  return null;
}

/**
 * 장면 요소 → 레이어 항목 목록.
 * 반환 순서는 패널 표시 순서(앞 레이어가 위) = 배열 z-order의 역순.
 */
export function buildLayers(elements: readonly SceneEl[]): LayerItem[] {
  const live = elements.filter((e) => !e.isDeleted);
  const byId = new Map(live.map((e) => [e.id, e]));

  // 컨테이너 id → 바인딩 텍스트 요소
  const textByContainer = new Map<string, SceneEl>();
  for (const e of live) {
    if (e.type === "text" && typeof e.containerId === "string") {
      textByContainer.set(e.containerId, e);
    }
  }

  const items: LayerItem[] = [];
  const indexByKey = new Map<string, number>();

  for (const e of live) {
    // 컨테이너에 바인딩된 텍스트는 컨테이너 항목에 흡수 (별도 항목 X)
    if (
      e.type === "text" &&
      typeof e.containerId === "string" &&
      byId.has(e.containerId)
    ) {
      continue;
    }

    const groupId = lastGroupId(e);
    const key = groupId ?? e.id;
    const isHidden = e.opacity === 0;
    const isLocked = Boolean(e.locked);

    const existing = indexByKey.get(key);
    if (existing !== undefined) {
      const item = items[existing];
      item.elementIds.push(e.id);
      item.locked = item.locked && isLocked; // 전부 잠겨야 잠김
      item.hidden = item.hidden && isHidden; // 전부 숨겨져야 숨김
      continue;
    }

    const elementIds = [e.id];
    const boundText = textByContainer.get(e.id);
    if (boundText) elementIds.push(boundText.id);

    const labelText =
      (boundText && String(boundText.text ?? "")) ||
      (e.type === "text" ? String(e.text ?? "") : "") ||
      typeLabel(e.type);

    indexByKey.set(key, items.length);
    items.push({
      key,
      label: groupId ? `그룹 · ${labelText}` : labelText,
      type: e.type,
      elementIds,
      locked: isLocked,
      hidden: isHidden,
    });
  }

  return items.reverse(); // 앞 레이어가 위로
}

// ── 연산 (새 요소 배열 반환) ────────────────────────

export function setLayerHidden<T extends SceneEl>(
  elements: readonly T[],
  item: LayerItem,
  hidden: boolean,
): T[] {
  const ids = new Set(item.elementIds);
  return elements.map((e) =>
    ids.has(e.id) ? { ...e, opacity: hidden ? 0 : 100 } : e,
  );
}

export function setLayerLocked<T extends SceneEl>(
  elements: readonly T[],
  item: LayerItem,
  locked: boolean,
): T[] {
  const ids = new Set(item.elementIds);
  return elements.map((e) => (ids.has(e.id) ? { ...e, locked } : e));
}

/**
 * 레이어 순서 변경.
 * @param panelItems 패널 표시 순서(앞 레이어가 위)
 * @param direction "up"=앞으로, "down"=뒤로
 */
export function reorderLayer<T extends SceneEl>(
  elements: readonly T[],
  panelItems: LayerItem[],
  key: string,
  direction: "up" | "down",
): T[] {
  const order = [...panelItems];
  const i = order.findIndex((x) => x.key === key);
  if (i < 0) return [...elements];
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= order.length) return [...elements];

  [order[i], order[j]] = [order[j], order[i]];

  // 배열 z-order = 패널 순서의 역순 (뒤 레이어가 배열 앞)
  const backFirst = [...order].reverse();
  const out: T[] = [];
  for (const it of backFirst) {
    const ids = new Set(it.elementIds);
    for (const e of elements) if (ids.has(e.id)) out.push(e);
  }
  // 어떤 항목에도 안 잡힌 요소(예: 삭제 표시)는 맨 앞에 보존
  const placed = new Set(out.map((e) => e.id));
  for (const e of elements) if (!placed.has(e.id)) out.unshift(e);
  return out;
}
