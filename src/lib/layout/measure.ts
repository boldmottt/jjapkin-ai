/**
 * 노드 크기 측정 (라벨에 맞춘 자동 크기)
 *
 * 캔버스 측정 없이도 합리적인 박스 크기를 추정한다. CJK 글자는 라틴보다 넓게
 * 잡아 한글 라벨이 잘리지 않게 한다. 결과는 자동 레이아웃(dagre)과 어댑터가
 * 노드 폭/높이로 사용한다.
 */
import { NODE_W, NODE_H } from "./constants";

const FONT_SIZE = 16;
const PAD_X = 28;
const PAD_Y = 20;
const LINE_H = Math.round(FONT_SIZE * 1.4);
const MIN_W = NODE_W; // 120~ 유지
const MAX_W = 280;

/** 글자 하나의 대략 폭(px) */
function charWidth(ch: string): number {
  const code = ch.codePointAt(0) ?? 0;
  // CJK(한글/한자/가나) + 전각 영역은 넓게
  const wide =
    (code >= 0x1100 && code <= 0x115f) || // 한글 자모
    (code >= 0x2e80 && code <= 0xa4cf) || // CJK 부수~한자
    (code >= 0xac00 && code <= 0xd7a3) || // 한글 음절
    (code >= 0xf900 && code <= 0xfaff) || // CJK 호환
    (code >= 0xff00 && code <= 0xff60); // 전각
  return wide ? FONT_SIZE : FONT_SIZE * 0.56;
}

function textWidth(label: string): number {
  let w = 0;
  for (const ch of label) w += charWidth(ch);
  return w;
}

export interface NodeSize {
  w: number;
  h: number;
  lines: number;
}

/** 라벨에 맞는 노드 크기(폭/높이/줄 수)를 추정 */
export function measureNodeSize(label: string): NodeSize {
  const total = textWidth(label || " ");
  // 한 줄에 다 들어가면 그 폭, 아니면 MAX_W로 줄바꿈
  const w = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(total) + PAD_X));
  const contentW = w - PAD_X;
  const lines = Math.max(1, Math.ceil(total / Math.max(1, contentW)));
  const h = Math.max(NODE_H, lines * LINE_H + PAD_Y);
  return { w, h, lines };
}
