"use client";

import { useDocumentStore, useGenerationStore, useEditorLayoutStore } from "@/stores";
import { useDiagramHistoryStore } from "@/stores/diagram-history";
import { MermaidPreview } from "@/features/diagram-generator/MermaidPreview";
import { TypeSelector } from "@/features/diagram-generator/TypeSelector";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiagramType, GenerationCandidate } from "@/types";
import { toast } from "@/stores/toast";
import {
  loadSnippets,
  saveSnippet,
  type Snippet,
} from "@/lib/snippets";
import { useRegisterCommands } from "@/hooks/useCommands";
import type { Command } from "@/stores/commands";

const MIN_CHARS = 10;
const MAX_CHARS = 5000;

export function TextEditor() {
  const { rawText, setRawText, title, setTitle } = useDocumentStore();
  const { status, error, setStatus, setCandidates, setError } = useGenerationStore();
  const { activeDiagramType, setActiveDiagramType, setShowCandidatePanel } =
    useEditorLayoutStore();
  const addHistoryEntry = useDiagramHistoryStore((s) => s.addEntry);

  const isLoading = status === "loading";
  const trimmedLen = rawText.trim().length;
  const tooShort = trimmedLen > 0 && trimmedLen < MIN_CHARS;
  const tooLong = rawText.length > MAX_CHARS;
  const canGenerate = trimmedLen >= MIN_CHARS && !tooLong && !isLoading;

  const handleGenerate = useCallback(async () => {
    if (isLoading) return; // 중복 제출 방지
    const text = rawText.trim();
    if (text.length < MIN_CHARS) {
      toast.error(`최소 ${MIN_CHARS}자 이상 입력해주세요.`);
      return;
    }
    if (rawText.length > MAX_CHARS) {
      toast.error(`최대 ${MAX_CHARS.toLocaleString()}자까지 지원됩니다.`);
      return;
    }

    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 사용자가 유형을 직접 골랐다면 전달, "AI 추천"(null)이면 생략
        body: JSON.stringify({
          text: rawText,
          ...(activeDiagramType ? { diagramType: activeDiagramType } : {}),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "생성 실패");

      const candidates = json.data.candidates as GenerationCandidate[];
      setCandidates(candidates);
      setActiveDiagramType(json.data.recommendedType);
      setShowCandidatePanel(true);
      // 추천(첫) 후보를 생성 히스토리에 기록
      if (candidates[0]) addHistoryEntry(candidates[0], rawText);
      toast.success(`${candidates.length}개의 다이어그램을 생성했어요.`);
    } catch (err) {
      // setError가 status를 "error"로 전환함
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(msg);
      toast.error(msg);
    }
  }, [
    isLoading,
    rawText,
    activeDiagramType,
    setCandidates,
    setError,
    setStatus,
    setActiveDiagramType,
    setShowCandidatePanel,
    addHistoryEntry,
  ]);

  // ⌨️ Ctrl/Cmd+Enter → 생성
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  const handleTypeSelect = useCallback(
    (type: DiagramType | null) => {
      setActiveDiagramType(type);
    },
    [setActiveDiagramType],
  );

  // ── 프롬프트 스니펫 (로컬 재사용) ──
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  useEffect(() => setSnippets(loadSnippets()), []);

  const handleSaveSnippet = useCallback(() => {
    const text = rawText.trim();
    if (text.length < MIN_CHARS) {
      toast.error("저장할 내용이 너무 짧습니다.");
      return;
    }
    const name = text.slice(0, 24).replace(/\s+/g, " ");
    setSnippets(saveSnippet(name, rawText));
    toast.success("스니펫 저장됨");
  }, [rawText]);

  const handleInsertSnippet = useCallback(
    (id: string) => {
      const snip = snippets.find((s) => s.id === id);
      if (snip) setRawText(snip.text);
    },
    [snippets, setRawText],
  );

  // 커맨드 팔레트(⌘K) 등록: 생성 / 스니펫 저장
  const paletteCommands = useMemo<Command[]>(
    () => [
      {
        id: "cmd-generate",
        label: "다이어그램 생성",
        group: "생성",
        keywords: "generate run",
        run: () => handleGenerate(),
      },
      {
        id: "cmd-save-snippet",
        label: "현재 입력을 스니펫으로 저장",
        group: "스니펫",
        run: () => handleSaveSnippet(),
      },
    ],
    [handleGenerate, handleSaveSnippet],
  );
  useRegisterCommands(paletteCommands);

  return (
    <div className="flex h-full flex-col p-4">
      {/* 제목 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 없음"
        className="mb-2 bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground/40"
      />

      {/* 다이어그램 유형 선택기 */}
      <TypeSelector selected={activeDiagramType} onSelect={handleTypeSelect} />

      {/* 프롬프트 스니펫 바 */}
      <div className="flex items-center gap-2 px-2 pb-1 text-xs">
        <button
          onClick={handleSaveSnippet}
          className="rounded border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50"
        >
          ＋ 스니펫 저장
        </button>
        {snippets.length > 0 && (
          <select
            aria-label="스니펫 불러오기"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleInsertSnippet(e.target.value);
              e.target.value = "";
            }}
            className="min-w-0 flex-1 rounded border bg-transparent px-2 py-1 text-[11px] outline-none"
          >
            <option value="" disabled>
              스니펫 불러오기…
            </option>
            {snippets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Mermaid 미리보기 */}
      <MermaidPreview visible={rawText.trim().length > 0} />

      {/* 본문 에디터 */}
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder={
          "여기에 텍스트를 붙여넣으세요...\n\n" +
          "예:\n" +
          '"고객이 주문하면 시스템이 재고를 확인합니다. ' +
          '재고가 있으면 결제를 처리하고 주문을 확정합니다. ' +
          '재고가 없으면 고객에게 알립니다."'
        }
        className="prose-custom mt-3 flex-1 resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-muted-foreground/40"
        spellCheck={false}
      />

      {/* 하단 정보 + 생성 버튼 */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span
            className={
              tooShort || tooLong ? "text-destructive" : "text-muted-foreground"
            }
          >
            {rawText.length.toLocaleString()}자
            {tooShort && ` · 최소 ${MIN_CHARS}자`}
            {tooLong && ` · 최대 ${MAX_CHARS.toLocaleString()}자 초과`}
          </span>
          <span className="text-muted-foreground">⌘/Ctrl+Enter 로 생성</span>
        </div>

        {/* 생성 실패 사유 (패널이 닫혀 있어도 보이도록 여기에 표시) */}
        {status === "error" && error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              생성 중...
            </>
          ) : (
            <>✨ 다이어그램 생성</>
          )}
        </button>
      </div>
    </div>
  );
}
