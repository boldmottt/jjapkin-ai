"use client";

import { useDocumentStore, useGenerationStore, useEditorLayoutStore } from "@/stores";
import { MermaidPreview } from "@/features/diagram-generator/MermaidPreview";
import { TypeSelector } from "@/features/diagram-generator/TypeSelector";
import { useCallback, useEffect } from "react";
import type { DiagramType } from "@/types";

export function TextEditor() {
  const { rawText, setRawText, title, setTitle } = useDocumentStore();
  const { setStatus, setCandidates, setError } = useGenerationStore();
  const { setActiveDiagramType, toggleCandidatePanel } = useEditorLayoutStore();

  const handleGenerate = useCallback(async () => {
    if (!rawText.trim()) return;
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "생성 실패");

      setCandidates(json.data.candidates);
      setActiveDiagramType(json.data.recommendedType);
      toggleCandidatePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    }
  }, [rawText, setCandidates, setError, setStatus, setActiveDiagramType, toggleCandidatePanel]);

  // ⌨️ Ctrl+Enter → 생성
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
      <TypeSelector selected={null} onSelect={handleTypeSelect} />

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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{rawText.length}자</span>
          <span>Ctrl+Enter 로 생성</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!rawText.trim()}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✨ 다이어그램 생성
        </button>
      </div>
    </div>
  );
}
