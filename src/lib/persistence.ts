/**
 * 클라이언트 문서 영속화 헬퍼
 *
 * 인증이 없으므로 브라우저 localStorage에 anonId/documentId를 보관하고
 * /api/documents 와 통신한다. 새로고침/재방문 시 같은 문서를 복원한다.
 */

import type { DiagramIR } from "@/types";

const ANON_KEY = "jjapkin:anonId";
const DOC_KEY = "jjapkin:documentId";

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

/** 현재 브라우저의 문서 저장 (best-effort) */
export async function saveDocument(payload: {
  title: string;
  rawText: string;
  diagram: PersistedDiagram | null;
}): Promise<void> {
  const documentId = getOrCreate(DOC_KEY);
  const anonId = getOrCreate(ANON_KEY);

  await fetch("/api/documents", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, anonId, ...payload }),
  });
}

/** 현재 브라우저의 문서 불러오기. 없으면 null */
export async function loadDocument(): Promise<LoadedDocument | null> {
  const documentId = getOrCreate(DOC_KEY);
  const anonId = getOrCreate(ANON_KEY);

  const res = await fetch(
    `/api/documents?documentId=${documentId}&anonId=${anonId}`,
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success || !json.found || !json.document) return null;
  return json.document as LoadedDocument;
}
