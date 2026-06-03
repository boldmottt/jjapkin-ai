"use client";

/**
 * 커맨드 팔레트 (⌘K / Ctrl+K)
 *
 * 레지스트리에 등록된 액션을 검색·실행하는 1인 워크플로우 허브.
 * 에디터 페이지에 한 번 마운트한다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useCommandStore, filterCommands } from "@/stores/commands";

export function CommandPalette() {
  const { commands, paletteOpen, setPaletteOpen, togglePalette } =
    useCommandStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 전역 단축키: ⌘K / Ctrl+K 토글
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette]);

  // 열릴 때 검색 초기화 + 포커스
  useEffect(() => {
    if (paletteOpen) {
      setQuery("");
      setActive(0);
      // 다음 틱에 포커스
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [paletteOpen]);

  const filtered = useMemo(
    () => filterCommands(commands, query),
    [commands, query],
  );

  useEffect(() => setActive(0), [query]);

  if (!paletteOpen) return null;

  const run = (idx: number) => {
    const cmd = filtered[idx];
    if (!cmd) return;
    setPaletteOpen(false);
    cmd.run();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setPaletteOpen(false);
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="명령 검색… (생성, 내보내기, 테마, 스니펫)"
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") setPaletteOpen(false);
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              run(active);
            }
          }}
        />
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              일치하는 명령이 없습니다
            </p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(i)}
                className={
                  "flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors " +
                  (i === active ? "bg-primary/10 text-primary" : "hover:bg-muted")
                }
              >
                <span>{cmd.label}</span>
                {cmd.group && (
                  <span className="text-[11px] text-muted-foreground">
                    {cmd.group}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
