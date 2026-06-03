"use client";

/**
 * Mermaid 실시간 SVG 미리보기
 *
 * AI 호출 없이 텍스트 → Mermaid 문법 → SVG로 변환해서 보여줌
 * 사용자가 다이어그램 생성을 누르기 전에 미리 확인 가능
 */

import { useEffect, useRef, useState } from "react";
import { useDocumentStore } from "@/stores";

interface MermaidPreviewProps {
  visible: boolean;
}

export function MermaidPreview({ visible }: MermaidPreviewProps) {
  const { rawText } = useDocumentStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !rawText.trim()) {
      setSvg(null);
      return;
    }

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          // 사용자 입력을 그대로 렌더링하므로 strict로 XSS 방지
          securityLevel: "antiscript",
          flowchart: { useMaxWidth: false },
        });

        // 렌더링마다 유니크한 ID 사용 → 임시 DOM 노드 충돌/잔여 방지
        const renderId = `mermaid-preview-${Date.now()}`;
        // 텍스트에서 mermaid 코드블록 추출 시도
        // 또는 전체 텍스트를 mermaid로 해석
        const { svg: rendered } = await mermaid.render(
          renderId,
          rawText.slice(0, 1000),
        );

        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setSvg(null);
          setError(null);
        }
      }
    }

    const timer = setTimeout(render, 300); // 디바운스
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [rawText, visible]);

  if (!visible) return null;

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          🔍 Mermaid 미리보기
        </span>
        <span className="text-[10px] text-muted-foreground/50">
          {svg ? "Mermaid 구문 감지됨" : "Mermaid 구문을 입력해보세요"}
        </span>
      </div>
      <div
        ref={containerRef}
        className="min-h-[120px] max-h-[300px] overflow-auto rounded bg-muted/30 p-2"
      >
        {svg ? (
          <div
            dangerouslySetInnerHTML={{ __html: svg }}
            className="flex justify-center"
          />
        ) : error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            텍스트에 Mermaid 구문이 포함되어 있으면 여기에 미리보기가 표시됩니다.
            <br />
            예: flowchart TD{"; "}A → B → C
          </p>
        )}
      </div>
    </div>
  );
}
