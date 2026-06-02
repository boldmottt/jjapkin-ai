/**
 * API 사용량 / 비용 로깅
 *
 * Prisma ApiUsageLog 모델에 생성 요청의 토큰·비용을 기록한다.
 * (인증이 없으므로 현재 userId는 null. 추후 인증 도입 시 연결)
 * DB 오류는 조용히 무시하여 본 요청 흐름을 막지 않는다.
 */

import { prisma } from "@/lib/db/prisma";

/** 모델별 대략적 단가 (USD per 1M tokens) — 비용 추정용 */
const PRICING: Array<{ match: RegExp; input: number; output: number }> = [
  { match: /deepseek/i, input: 0.27, output: 1.1 },
  { match: /gpt-4o-mini/i, input: 0.15, output: 0.6 },
  { match: /gpt-4o/i, input: 2.5, output: 10 },
  { match: /claude.*sonnet/i, input: 3, output: 15 },
];

export function estimateCost(
  model: string,
  tokensInput: number,
  tokensOutput: number,
): number {
  const price = PRICING.find((p) => p.match.test(model));
  if (!price) return 0;
  return (
    (tokensInput / 1_000_000) * price.input +
    (tokensOutput / 1_000_000) * price.output
  );
}

export async function logApiUsage(entry: {
  model: string;
  tokensInput: number;
  tokensOutput: number;
  diagramType: string;
  success: boolean;
}): Promise<void> {
  if (!prisma) return;
  try {
    await prisma.apiUsageLog.create({
      data: {
        model: entry.model,
        tokensInput: entry.tokensInput,
        tokensOutput: entry.tokensOutput,
        cost: estimateCost(entry.model, entry.tokensInput, entry.tokensOutput),
        diagramType: entry.diagramType,
        success: entry.success,
      },
    });
  } catch (error) {
    console.warn("[usage-log] write failed:", (error as Error).message);
  }
}
