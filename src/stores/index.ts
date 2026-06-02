import { create } from "zustand";
import type { DiagramType, GenerationCandidate } from "@/types";

// ── 편집기 레이아웃 상태 ────────────────────────────

interface EditorLayoutState {
  /** 좌측 텍스트 패널 너비 비율 (0~1) */
  textPanelRatio: number;
  /** 하단 후보 패널 표시 여부 */
  showCandidatePanel: boolean;
  /** 현재 활성화된 다이어그램 유형 */
  activeDiagramType: DiagramType | null;

  setTextPanelRatio: (ratio: number) => void;
  toggleCandidatePanel: () => void;
  setShowCandidatePanel: (show: boolean) => void;
  setActiveDiagramType: (type: DiagramType | null) => void;
}

export const useEditorLayoutStore = create<EditorLayoutState>((set) => ({
  textPanelRatio: 0.4,
  showCandidatePanel: false,
  activeDiagramType: null,

  setTextPanelRatio: (ratio) => set({ textPanelRatio: ratio }),
  toggleCandidatePanel: () =>
    set((s) => ({ showCandidatePanel: !s.showCandidatePanel })),
  setShowCandidatePanel: (show) => set({ showCandidatePanel: show }),
  setActiveDiagramType: (type) => set({ activeDiagramType: type }),
}));

// ── 다이어그램 생성 상태 ────────────────────────────

type GenerationStatus = "idle" | "loading" | "success" | "error";

interface GenerationState {
  status: GenerationStatus;
  candidates: GenerationCandidate[];
  selectedCandidateId: string | null;
  error: string | null;

  setStatus: (status: GenerationStatus) => void;
  setCandidates: (candidates: GenerationCandidate[]) => void;
  selectCandidate: (id: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  status: "idle",
  candidates: [],
  selectedCandidateId: null,
  error: null,

  setStatus: (status) => set({ status }),
  setCandidates: (candidates) =>
    set({
      candidates,
      // 추천(첫 번째) 후보를 자동 선택해 생성 직후 캔버스가 비지 않도록 함
      selectedCandidateId: candidates[0]?.id ?? null,
      status: "success",
      error: null,
    }),
  selectCandidate: (id) => set({ selectedCandidateId: id }),
  setError: (error) => set({ error, status: "error" }),
  reset: () =>
    set({
      status: "idle",
      candidates: [],
      selectedCandidateId: null,
      error: null,
    }),
}));

// ── 문서 상태 (자동 저장용) ─────────────────────────

interface DocumentState {
  title: string;
  rawText: string;
  isDirty: boolean;
  lastSavedAt: string | null;

  setTitle: (title: string) => void;
  setRawText: (text: string) => void;
  markSaved: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  title: "Untitled",
  rawText: "",
  isDirty: false,
  lastSavedAt: null,

  setTitle: (title) => set({ title, isDirty: true }),
  setRawText: (text) => set({ rawText: text, isDirty: true }),
  markSaved: () => set({ isDirty: false, lastSavedAt: new Date().toISOString() }),
}));

// ── AI 파이프라인 상태 ──────────────────────────────

interface AiPipelineState {
  /** 실제 폴백 체인(openai.ts)에서 사용하는 모델 식별자와 일치 */
  selectedModel: "deepseek-chat" | "gpt-4o-mini" | "claude-3-5-sonnet";
  cacheEnabled: boolean;
  /**
   * UI 표시용 캐시일 뿐, 진실의 원천이 아님.
   * 실제 과금/한도는 서버(User.creditsUsed)에서 관리해야 하며
   * 새로고침 시 초기값으로 리셋됨.
   */
  creditsRemaining: number;

  setModel: (model: AiPipelineState["selectedModel"]) => void;
  setCacheEnabled: (enabled: boolean) => void;
  decrementCredits: (amount: number) => void;
}

export const useAiPipelineStore = create<AiPipelineState>((set) => ({
  selectedModel: "deepseek-chat",
  cacheEnabled: true,
  creditsRemaining: 500,

  setModel: (model) => set({ selectedModel: model }),
  setCacheEnabled: (enabled) => set({ cacheEnabled: enabled }),
  decrementCredits: (amount) =>
    set((s) => ({ creditsRemaining: Math.max(0, s.creditsRemaining - amount) })),
}));
