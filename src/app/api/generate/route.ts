/**
 * POST /api/generate
 *
 * 텍스트 → AI 분석 → 3개 다이어그램 후보 생성
 *
 * 파이프라인:
 *   1. 텍스트 유효성 검사
 *   2. 캐시 확인 (중복 생성 방지)
 *   3. DeepSeek API 호출 (→ OpenAI → Claude 폴백)
 *   4. 응답 파싱 + 검증
 *   5. 캐시 저장
 *   6. 응답 반환
 */

import { NextResponse } from "next/server";
import type { GenerationRequest, GenerationResponse, ApiResponse } from "@/types";
import { chatCompletionWithFallback } from "@/lib/ai/openai";
import { buildMessages } from "@/lib/ai/prompts";
import { parseAIResponse, buildGenerationResponse, inferDiagramType } from "@/lib/ai/parser";
import { getCachedResult, setCachedResult } from "@/lib/ai/cache";
import { logApiUsage } from "@/lib/ai/usage-log";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // 레이트리밋 (IP 기반, best-effort)
    const ip = getClientIp(request);
    const limit = checkRateLimit(`generate:${ip}`);
    if (!limit.ok) {
      return errorResponse(
        429,
        "RATE_LIMIT",
        "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
        { "Retry-After": String(limit.retryAfter) },
      );
    }

    const body: GenerationRequest = await request.json();

    const validationError = validateRequest(body);
    if (validationError) {
      return errorResponse(400, validationError.code, validationError.message);
    }

    const text = body.text.trim();
    const diagramType = body.diagramType ?? inferDiagramType(text);

    // 캐시 확인
    const cached = await getCachedResult(text, diagramType);
    if (cached) {
      console.info(
        `[generate] Cache hit — type=${diagramType}, ${Date.now() - startTime}ms`,
      );
      return successResponse(
        buildGenerationResponse(cached.candidates, { tokensUsed: 0, fromCache: true }),
      );
    }

    // AI 호출: DeepSeek → OpenAI → Claude
    const { system, user } = buildMessages(text, diagramType);
    const result = await chatCompletionWithFallback({
      systemPrompt: system,
      userMessage: user,
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: "json",
    });

    // 응답 파싱
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(result.content);
    } catch {
      throw new Error(
        `AI returned invalid JSON. Raw: "${result.content.slice(0, 300)}"`,
      );
    }

    const candidates = parseAIResponse(parsedJson);

    // 캐시 저장
    await setCachedResult(text, diagramType, candidates, {
      modelUsed: result.model,
      tokensUsed: result.tokensInput + result.tokensOutput,
    });

    // 사용량/비용 기록 (실패해도 요청 흐름 막지 않음)
    await logApiUsage({
      model: result.model,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
      diagramType,
      success: true,
    });

    const duration = Date.now() - startTime;
    console.info(
      `[generate] OK — model=${result.model}, ${candidates.length} candidates, ${duration}ms`,
    );

    return successResponse(
      buildGenerationResponse(candidates, {
        tokensUsed: result.tokensInput + result.tokensOutput,
        fromCache: false,
      }),
    );
  } catch (error) {
    // 상세 원인은 서버 로그에만 남기고, 클라이언트에는 일반 메시지만 전달
    const message = (error as Error).message;
    console.error(`[generate] FAIL (${Date.now() - startTime}ms):`, message);

    if (message.includes("401") || message.includes("Incorrect API key")) {
      return errorResponse(500, "SERVICE_UNAVAILABLE", "일시적으로 생성 서비스를 사용할 수 없습니다.");
    }
    if (message.includes("429") || message.includes("rate limit")) {
      return errorResponse(429, "RATE_LIMIT", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
    }

    return errorResponse(500, "GENERATION_FAILED", "다이어그램 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
}

function validateRequest(body: GenerationRequest): { code: string; message: string } | null {
  if (!body.text || typeof body.text !== "string") {
    return { code: "MISSING_TEXT", message: "text 필드가 필요합니다." };
  }
  const trimmed = body.text.trim();
  if (trimmed.length < 10) {
    return { code: "TEXT_TOO_SHORT", message: "최소 10자 이상의 텍스트가 필요합니다." };
  }
  if (trimmed.length > 5000) {
    return { code: "TEXT_TOO_LONG", message: "최대 5,000자까지 지원됩니다." };
  }
  return null;
}

function successResponse(data: GenerationResponse) {
  // POST 응답은 브라우저/프록시가 캐싱하지 않으므로 캐시 헤더를 두지 않는다.
  // (중복 생성 방지는 서버측 DB 캐시가 담당)
  return NextResponse.json(
    { success: true, data } satisfies ApiResponse<GenerationResponse>,
  );
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { success: false, error: { code, message } } satisfies ApiResponse<never>,
    { status, ...(headers ? { headers } : {}) },
  );
}
