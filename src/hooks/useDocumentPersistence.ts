"use client";

/**
 * 문서 자동 저장 + 복원 훅
 *
 * - mount 시 서버에서 문서를 불러와 텍스트/제목 + 선택 다이어그램을 복원
 * - 이후 텍스트/제목/편집 장면 변경을 디바운스(1.5s)로 자동 저장
 *
 * DB가 없으면 서버가 best-effort no-op으로 응답하므로 안전하게 동작한다.
 */

import { useEffect, useRef } from "react";
import { useDocumentStore, useGenerationStore } from "@/stores";
import { loadDocument, saveDocument } from "@/lib/persistence";
import type { DiagramIR } from "@/types";

const PERSISTED_CANDIDATE_ID = "persisted";

export function useDocumentPersistence() {
  const rawText = useDocumentStore((s) => s.rawText);
  const title = useDocumentStore((s) => s.title);
  const hydrateDoc = useDocumentStore((s) => s.hydrate);

  const selectedCandidateId = useGenerationStore((s) => s.selectedCandidateId);
  const editedScenes = useGenerationStore((s) => s.editedScenes);

  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) 최초 1회 복원
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadDocument();
        if (cancelled || !loaded) return;

        hydrateDoc(loaded.title, loaded.rawText);

        const ir = loaded.diagram?.data?.ir as DiagramIR | undefined;
        if (ir) {
          useGenerationStore.getState().hydratePersisted(
            { id: PERSISTED_CANDIDATE_ID, ir },
            loaded.diagram?.data?.elements ?? [],
          );
        }
      } finally {
        if (!cancelled) loadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateDoc]);

  // 2) 변경 시 디바운스 자동 저장
  useEffect(() => {
    if (!loadedRef.current) return; // 복원 완료 전엔 저장 안 함
    if (!rawText.trim()) return; // 빈 문서는 저장하지 않음

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const g = useGenerationStore.getState();
      const selected =
        g.candidates.find((c) => c.id === g.selectedCandidateId) ?? null;
      const elements = g.selectedCandidateId
        ? g.editedScenes[g.selectedCandidateId]
        : undefined;

      saveDocument({
        title,
        rawText,
        diagram: selected
          ? {
              sourceText: rawText,
              diagramType: selected.ir.diagramType,
              data: { ir: selected.ir, elements: elements ?? [] },
            }
          : null,
      })
        .then((saved) => {
          // 로컬 저장만 성공해도 "저장됨"으로 표시 (로컬 모드)
          if (saved) useDocumentStore.getState().markSaved();
        })
        .catch(() => {
          /* best-effort */
        });
    }, 1500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [rawText, title, selectedCandidateId, editedScenes]);
}
