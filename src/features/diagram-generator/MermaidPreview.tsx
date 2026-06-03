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

// Mermaid 다이어그램 시작 키워드(이걸로 시작해야 Mermaid로 간주)
const MERMAID_KEYWORDS =
  /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|C4Context|sankey(-beta)?|xychart(-beta)?|block(-beta)?)\b/;

/**
 * 입력에서 Mermaid 소스를 추출한다.
 * 1) ```mermaid 펜스 코드블록이 있으면 그 안을 사용
 * 2) 없으면 첫 줄이 Mermaid 키워드로 시작할 때만 전체를 Mermaid로 간주
 * 3) 둘 다 아니면(=자연어) null → 미리보기를 시도하지 않음
 */
function extractMermaid(text: string): string | null {
  const fenced = /```mermaid\s*\n([\s\S]*?)```/i.exec(text);
  if (fenced) return fenced[1].trim();
  const trimmed = text.trim();
  return MERMAID_KEYWORDS.test(trimmed) ? trimmed : null;
}

export function MermaidPreview({ visible }: MermaidPreviewProps) {
  const { rawText } = useDocumentStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 이 앱의 입력은 대부분 "자연어"다. 자연어를 Mermaid로 렌더하면 매번
    // "Syntax error in text"가 떠 UX를 해친다. → 입력이 실제 Mermaid일 때만 렌더.
    const source = extractMermaid(rawText);
    if (!visible || !source) {
      setSvg(null);
      setError(null);
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
          securityLevel: "strict",
          flowchart: { useMaxWidth: false },
        });

        // 렌더링마다 유니크한 ID 사용 → 임시 DOM 노드 충돌/잔여 방지
        const renderId = `mermaid-preview-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(
          renderId,
          source!.slice(0, 1000),
        );

        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSvg(null);
          // 문법 오류(Parse/Syntax error)는 "아직 작성 중"인 정상 상황 → 표시 안 함
          const msg = (err as Error).message ?? "";
          setError(
            /parse error|syntax error/i.test(msg) ? null : msg,
          );
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
