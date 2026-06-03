/**
 * AI 응답 파서
 *
 * AI(DeepSeek → OpenAI → Claude)가 반환한 JSON을 DiagramIR, GenerationCandidate 로 변환
 * Zod 스키마로 유효성 검사 + 기본값 보정
 */

import { z } from "zod";
import type { DiagramType, GenerationCandidate, GenerationResponse } from "@/types";
import { DIAGRAM_TYPES } from "@/types";

// ── Zod 스키마 ─────────────────────────────────────

const nodeSchema = z.object({
  id: z.string().min(1, "Node id is required"),
  label: z.string().min(1, "Node label is required").max(100),
  type: z.enum(["start", "process", "decision", "end"]).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  value: z.number().finite().optional(), // bar-chart/funnel 수치
  group: z.string().max(50).optional(), // swimlane 레인
  icon: z
    .string()
    .regex(/^([a-z0-9-]+:)?[a-z0-9-]+$/, "Invalid icon id")
    .max(60)
    .optional(), // lucide 아이콘 id
});

const edgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().max(50).optional(),
});

const diagramTypeSchema = z.enum(DIAGRAM_TYPES);

const candidateSchema = z.object({
  id: z.string().min(1),
  diagramType: diagramTypeSchema,
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional(),
  nodes: z.array(nodeSchema).min(1, "At least one node required").max(15),
  edges: z.array(edgeSchema).max(30),
});

const aiResponseSchema = z.object({
  candidates: z.array(candidateSchema).min(1).max(3),
});

// ── 파서 함수 ──────────────────────────────────────

/**
 * AI JSON 응답을 GenerationCandidate[] 로 변환
 * 유효성 검사 실패 시 상세 오류 반환
 */
export function parseAIResponse(rawJson: unknown): GenerationCandidate[] {
  const result = aiResponseSchema.safeParse(rawJson);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `AI response validation failed:\n${issues}\n\nRaw response: ${JSON.stringify(rawJson).slice(0, 300)}`,
    );
  }

  // 기본값 보정
  return result.data.candidates.map((c) => ({
    id: c.id,
    ir: {
      diagramType: c.diagramType,
      title: c.title,
      description: c.description,
      nodes: c.nodes.map((n) => {
        const type = n.type ?? "process"; // 기본값 보정
        return {
          ...n,
          type,
          color: n.color ?? DEFAULT_NODE_COLORS[type],
        };
      }),
      edges: c.edges.map((e) => ({
        ...e,
        label: e.label ?? undefined, // 빈 문자열 → undefined
      })),
    },
  }));
}

/**
 * AI 응답 + 메타데이터 → GenerationResponse 완성
 */
export function buildGenerationResponse(
  candidates: GenerationCandidate[],
  opts: {
    tokensUsed: number;
    fromCache: boolean;
  },
): GenerationResponse {
  if (candidates.length === 0) {
    throw new Error("No candidates generated");
  }

  return {
    candidates,
    recommendedType: candidates[0].ir.diagramType,
    tokensUsed: opts.tokensUsed,
    fromCache: opts.fromCache,
  };
}

// ── 기본값 ─────────────────────────────────────────

export const DEFAULT_NODE_COLORS: Record<string, string> = {
  start: "#10B981",
  process: "#3B82F6",
  decision: "#F59E0B",
  end: "#EF4444",
};

// ── 유틸리티 ────────────────────────────────────────

/**
 * 단일 텍스트 청크에 대한 적절한 다이어그램 유형 추론 (fallback)
 */
export function inferDiagramType(text: string): DiagramType {
  const lower = text.toLowerCase();

  // 키워드 기반 휴리스틱 (우선순위 순)
  // 1. 분기: if-else, 조건부
  if (/(or|또는|혹은|if\b|만약|otherwise|아니면|그렇지 않으면)/.test(lower)) {
    return "flowchart";
  }
  // 2. 계층/조직: 트리 구조 (프로세스보다 먼저 체크!)
  if (/(hierarchy|계층|조직|structure|산하|하위|상위)\s*(구조|도|표)?/.test(lower)) {
    return "mindmap";
  }
  if (/(부서\s*구성|팀\s*구성|구성원|조직도)/.test(lower)) {
    return "mindmap";
  }
  // 3. 순차/단계: step-by-step (일반적인 '다음'보다 'X단계' 우선)
  if (/(step\s*\d|phase\s*\d|\d+단계|순서|먼저\s*~|마지막으로)/.test(lower)) {
    return "process";
  }
  // 4. 비교: A vs B
  if (/(compare|비교|\bvs\b|대비|difference|차이점|장단점|장점\s*단점)/.test(lower)) {
    return "comparison";
  }
  // 5. 타임라인: 연대/시간순 (연도·날짜·역사)
  if (
    /(timeline|연대|연혁|타임라인|history of|\b\d{4}년\b|\b(19|20)\d{2}\b.*\b(19|20)\d{2}\b|시간\s*순|연도별)/.test(
      lower,
    )
  ) {
    return "timeline";
  }

  return "flowchart"; // 기본값
}

// sha256은 server-only이므로 cache.ts에서 직접 import
