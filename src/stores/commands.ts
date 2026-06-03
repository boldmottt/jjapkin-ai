/**
 * 커맨드 레지스트리 (⌘K 커맨드 팔레트용)
 *
 * 여러 컴포넌트(텍스트 편집기·캔버스 등)가 자신의 액션을 등록하고, 팔레트는
 * 등록된 액션을 검색·실행한다. 컴포넌트는 mount 시 register, unmount 시
 * unregister 한다.
 */
import { create } from "zustand";

export interface Command {
  id: string;
  label: string;
  group?: string;
  keywords?: string;
  run: () => void;
}

interface CommandState {
  commands: Command[];
  paletteOpen: boolean;
  register: (cmd: Command) => void;
  unregister: (id: string) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  commands: [],
  paletteOpen: false,
  register: (cmd) =>
    set((s) => ({
      commands: [...s.commands.filter((c) => c.id !== cmd.id), cmd],
    })),
  unregister: (id) =>
    set((s) => ({ commands: s.commands.filter((c) => c.id !== id) })),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
}));

/** 검색어로 커맨드 필터링(라벨/그룹/키워드 부분일치, 순수 함수) */
export function filterCommands(commands: Command[], query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) =>
    `${c.label} ${c.group ?? ""} ${c.keywords ?? ""}`.toLowerCase().includes(q),
  );
}
