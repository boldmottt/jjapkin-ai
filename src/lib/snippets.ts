/**
 * 프롬프트 스니펫 & 다이어그램 템플릿 (로컬 영속, 1인 재사용)
 *
 * 자주 쓰는 입력 텍스트(스니펫)와 다이어그램 IR(템플릿)을 localStorage에
 * 저장/재사용한다. 순수 로직 + 얇은 스토리지 래퍼로 분리해 테스트 가능하게 둔다.
 */
import type { DiagramIR } from "@/types";

export interface Snippet {
  id: string;
  title: string;
  text: string;
}

export interface Template {
  id: string;
  title: string;
  ir: DiagramIR;
}

const SNIPPET_KEY = "jjapkin:snippets";
const TEMPLATE_KEY = "jjapkin:templates";

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

// ── 순수 리스트 연산 ────────────────────────────────

export function addItem<T extends { id: string }>(list: T[], item: T): T[] {
  return [item, ...list.filter((x) => x.id !== item.id)];
}

export function removeItem<T extends { id: string }>(
  list: T[],
  id: string,
): T[] {
  return list.filter((x) => x.id !== id);
}

// ── 스토리지 래퍼 (SSR/미지원 환경에서 안전) ─────────

function read<T>(key: string): T[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, list: T[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* 용량 초과 등 무시 */
  }
}

// ── 스니펫 ──────────────────────────────────────────

export function loadSnippets(): Snippet[] {
  return read<Snippet>(SNIPPET_KEY);
}

export function saveSnippet(title: string, text: string): Snippet[] {
  const item: Snippet = { id: genId("snip"), title: title.trim() || "무제", text };
  const next = addItem(loadSnippets(), item);
  write(SNIPPET_KEY, next);
  return next;
}

export function deleteSnippet(id: string): Snippet[] {
  const next = removeItem(loadSnippets(), id);
  write(SNIPPET_KEY, next);
  return next;
}

// ── 템플릿 ──────────────────────────────────────────

export function loadTemplates(): Template[] {
  return read<Template>(TEMPLATE_KEY);
}

export function saveTemplate(title: string, ir: DiagramIR): Template[] {
  const item: Template = { id: genId("tpl"), title: title.trim() || ir.title, ir };
  const next = addItem(loadTemplates(), item);
  write(TEMPLATE_KEY, next);
  return next;
}

export function deleteTemplate(id: string): Template[] {
  const next = removeItem(loadTemplates(), id);
  write(TEMPLATE_KEY, next);
  return next;
}
