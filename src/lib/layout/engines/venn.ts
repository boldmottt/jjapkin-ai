/**
 * 벤다이어그램 레이아웃: 2~3개 원(타원)을 겹쳐 배치.
 * 4개 이상이면 첫 3개를 원으로, 나머지는 아래 행에 나열한다.
 */
import { START_Y } from "../constants";
import type { LayoutFn, NodePosition } from "../types";

const D = 220; // 원 지름
const CENTER_X = 400;

// 반투명 느낌의 파스텔(겹침 영역이 자연스럽게 보이도록)
const VENN_COLORS = ["#93C5FD", "#FCA5A5", "#86EFAC"];

export const vennLayout: LayoutFn = (nodes) => {
  const positions: NodePosition[] = [];
  const circles = nodes.slice(0, 3);
  const overlap = D * 0.35;

  // 2개: 좌우, 3개: 삼각형(위 2 + 아래 1)
  const centers: Array<[number, number]> =
    circles.length <= 2
      ? [
          [CENTER_X - (D - overlap) / 2, START_Y + D / 2],
          [CENTER_X + (D - overlap) / 2, START_Y + D / 2],
        ]
      : [
          [CENTER_X - (D - overlap) / 2, START_Y + D / 2],
          [CENTER_X + (D - overlap) / 2, START_Y + D / 2],
          [CENTER_X, START_Y + D / 2 + (D - overlap)],
        ];

  circles.forEach((node, i) => {
    const [cx, cy] = centers[i];
    positions.push({
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? VENN_COLORS[i % VENN_COLORS.length],
      x: cx - D / 2,
      y: cy - D / 2,
      w: D,
      h: D,
      shape: "ellipse",
      opacity: 65, // 겹침 영역이 비치도록 반투명
    });
  });

  // 초과 노드: 아래 행에 사각형으로 나열
  const rest = nodes.slice(3);
  let x = 120;
  const restY = START_Y + 2 * D;
  for (const node of rest) {
    positions.push({
      id: node.id,
      label: node.label,
      type: node.type ?? "process",
      color: node.color ?? "#E5E7EB",
      x,
      y: restY,
    });
    x += 200;
  }

  return positions;
};
