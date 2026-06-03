/**
 * 레이아웃 공통 상수 (노드 크기·간격·시작 좌표)
 *
 * 과거 ir-to-excalidraw에 하드코딩돼 있던 매직넘버를 한 곳으로 추출.
 * 레이아웃 엔진과 Excalidraw 어댑터가 공유한다.
 */
export const NODE_W = 160;
export const NODE_H = 60;
export const H_GAP = 80; // 수평 간격 (노드 사이)
export const V_GAP = 60; // 수직 간격 (층 사이)
export const START_X = 100;
export const START_Y = 80;
