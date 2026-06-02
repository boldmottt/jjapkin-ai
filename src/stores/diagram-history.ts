/**
 * 다이어그램 히스토리 스토어
 *
 * 생성된 모든 다이어그램을 히스토리로 관리
 * 탭 전환, 삭제 기능
 */

import { create } from "zustand";
import type { GenerationCandidate } from "@/types";

interface HistoryEntry {
  id: string;
  candidate: GenerationCandidate;
  createdAt: number;
  text: string;
}

interface DiagramHistoryState {
  entries: HistoryEntry[];
  addEntry: (candidate: GenerationCandidate, text: string) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
}

export const useDiagramHistoryStore = create<DiagramHistoryState>((set) => ({
  entries: [],

  addEntry: (candidate, text) =>
    set((s) => ({
      // entry id는 고유해야 함. candidate.id("c1" 등)는 생성마다 재사용되므로
      // 이를 그대로 쓰면 이전 히스토리를 덮어써 누적이 되지 않는다.
      entries: [
        {
          id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          candidate,
          createdAt: Date.now(),
          text: text.slice(0, 100),
        },
        ...s.entries,
      ].slice(0, 20), // 최대 20개 유지
    })),

  removeEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

  clearHistory: () => set({ entries: [] }),
}));
