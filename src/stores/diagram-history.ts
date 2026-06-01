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
      entries: [
        {
          id: candidate.id,
          candidate,
          createdAt: Date.now(),
          text: text.slice(0, 100),
        },
        ...s.entries.filter((e) => e.id !== candidate.id),
      ].slice(0, 20), // 최대 20개 유지
    })),

  removeEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

  clearHistory: () => set({ entries: [] }),
}));
