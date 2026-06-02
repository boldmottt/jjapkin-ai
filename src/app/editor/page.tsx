"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useEditorLayoutStore, useGenerationStore, useDocumentStore } from "@/stores";
import { TextEditor } from "@/features/text-editor/TextEditor";
import { CanvasEditor } from "@/features/canvas-editor/CanvasEditor";
import { CandidatePanel } from "@/features/diagram-generator/CandidatePanel";
import { useDocumentPersistence } from "@/hooks/useDocumentPersistence";
import { AuthButton } from "@/features/auth/AuthButton";
import { useTheme } from "next-themes";
import { Moon, Sun, ArrowLeft } from "lucide-react";

export default function EditorPage() {
  const { showCandidatePanel } = useEditorLayoutStore();
  const { candidates, selectedCandidateId } = useGenerationStore();
  const { isDirty, lastSavedAt } = useDocumentStore();
  const { theme, setTheme } = useTheme();

  // 문서 자동 저장 + 새로고침 복원
  useDocumentPersistence();
  const [splitPercent, setSplitPercent] = useState(40);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  // 패널 드래그 핸들러
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(pct, 20), 60));
    };

    const handleUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-bold">JJapkin AI</h1>
          {selectedCandidate && (
            <span className="hidden rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              {selectedCandidate.ir.diagramType}
            </span>
          )}
          {lastSavedAt && (
            <span className="hidden text-xs text-muted-foreground/70 sm:inline">
              {isDirty ? "저장 중…" : "저장됨"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded p-1.5 transition-colors hover:bg-muted"
            aria-label="다크모드 전환"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <AuthButton />
        </div>
      </header>

      {/* Main Split Pane with draggable divider */}
      <main ref={containerRef} className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Text Editor */}
        <section
          className="panel-transition overflow-auto border-b md:border-b-0 md:border-r"
          style={{
            width: `clamp(260px, ${splitPercent}%, 60%)`,
            minHeight: 0,
          }}
        >
          <TextEditor />
        </section>

        {/* Draggable Divider (desktop only) */}
        <div
          onMouseDown={handleMouseDown}
          className="hidden w-1 cursor-col-resize bg-border hover:bg-primary/30 transition-colors md:block"
        />

        {/* Canvas Editor */}
        <section className="flex flex-1 flex-col">
          <div className="flex-1">
            <CanvasEditor />
          </div>
          {showCandidatePanel && <CandidatePanel />}
        </section>
      </main>
    </div>
  );
}
