/**
 * 클라이언트 문서 영속화 헬퍼
 *
 * 로컬 우선(localStorage) + 서버 동기화(/api/documents) 전략.
 *   - 로그인/DB가 없어도(= 로컬 모드) 브라우저에 저장되어 새로고침/재방문에도 유지
 *   - 로그인/DB가 있으면 서버를 우선 사용하고 로컬은 캐시로 동기화
 *
 * 브라우저별 anonId/documentId는 localStorage에 보관한다.
 */

import type { DiagramIR } from "@/types";

const ANON_KEY = "jjapkin:anonId";
const DOC_KEY = "jjapkin:documentId";
const LOCAL_DOC_KEY = "jjapkin:doc"; // 로컬 모드 문서 캐시

/** 저장된 anonId를 생성 없이 반환 (없으면 null). 로그인 claim에 사용 */
export function getStoredAnonId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ANON_KEY);
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // 매우 구형 환경 폴백
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreate(key: string): string {
  let v = localStorage.getItem(key);
  if (!v) {
    v = uuid();
    localStorage.setItem(key, v);
  }
  return v;
}

export interface PersistedDiagram {
  sourceText: string;
  diagramType: string;
  data: { ir?: DiagramIR; elements?: readonly unknown[] };
}

export interface LoadedDocument {
  title: string;
  rawText: string;
  diagram: PersistedDiagram | null;
}

// ── 로컬(localStorage) 저장소 ───────────────────────

function saveLocal(doc: LoadedDocument): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LOCAL_DOC_KEY, JSON.stringify(doc));
  } catch {
    // 용량 초과 등 — 무시 (서버 동기화가 있다면 거기에 의존)
  }
}

function loadLocal(): LoadedDocument | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_DOC_KEY);
    return raw ? (JSON.parse(raw) as LoadedDocument) : null;
  } catch {
    return null;
  }
}

// ── 저장 ────────────────────────────────────────────

/**
 * 문서 저장. 로컬에 즉시 저장한 뒤 서버에 best-effort 동기화한다.
 * 로컬 저장에 성공하면 true (로컬 모드에서도 "저장됨"으로 표시 가능).
 */
export async function saveDocument(payload: LoadedDocument): Promise<boolean> {
  // 1) 로컬 우선 저장 (로그인/DB 없어도 동작)
  saveLocal(payload);

  // 2) 서버 동기화 (가능할 때) — 실패해도 무시
  try {
    const documentId = getOrCreate(DOC_KEY);
    const anonId = getOrCreate(ANON_KEY);
    await fetch("/api/documents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, anonId, ...payload }),
    });
  } catch {
    // 로컬 모드(네트워크/DB 없음) — 로컬 저장으로 충분
  }

  return true;
}

// ── 불러오기 ────────────────────────────────────────

/**
 * 문서 불러오기. 서버(로그인/DB)를 우선 시도하고, 없으면 로컬 캐시로 폴백.
 */
export async function loadDocument(): Promise<LoadedDocument | null> {
  try {
    const documentId = getOrCreate(DOC_KEY);
    const anonId = getOrCreate(ANON_KEY);
    const res = await fetch(
      `/api/documents?documentId=${documentId}&anonId=${anonId}`,
    );
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json.found && json.document) {
        const doc = json.document as LoadedDocument;
        saveLocal(doc); // 로컬 캐시 갱신
        return doc;
      }
    }
  } catch {
    // 서버 불가 — 로컬 폴백
  }

  return loadLocal();
}
