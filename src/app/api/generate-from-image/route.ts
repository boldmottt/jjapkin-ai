/**
 * POST /api/generate-from-image
 *
 * 손그림/스크린샷 이미지 → 비전 모델 → 다이어그램 후보(JSON).
 * 비전은 OpenAI/Anthropic 키가 필요(DeepSeek 미지원).
 */
import { NextResponse } from "next/server";
import type { ApiResponse, GenerationResponse } from "@/types";
import { chatCompletionVision } from "@/lib/ai/openai";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { parseAIResponse, buildGenerationResponse } from "@/lib/ai/parser";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_BYTES = 6 * 1024 * 1024; // ~6MB

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`image:${ip}`);
    if (!limit.ok) {
      return err(429, "RATE_LIMIT", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", {
        "Retry-After": String(limit.retryAfter),
      });
    }

    const body = (await request.json()) as { image?: string };
    const image = body.image;
    if (!image || !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(image)) {
      return err(400, "INVALID_IMAGE", "PNG/JPEG/WEBP 이미지를 올려주세요.");
    }
    // base64 길이로 대략 용량 검사
    if (image.length * 0.75 > MAX_BYTES) {
      return err(400, "IMAGE_TOO_LARGE", "이미지가 너무 큽니다(최대 6MB).");
    }

    const result = await chatCompletionVision({
      systemPrompt: SYSTEM_PROMPT,
      userMessage:
        "이 이미지(손그림/스케치/스크린샷)에 담긴 다이어그램을 읽어 구조화된 JSON으로 변환하세요. 노드/엣지/유형을 추론하고, 지정된 출력 형식의 candidates를 반환하세요.",
      imageDataUrl: image,
      maxTokens: 2000,
      responseFormat: "json",
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      throw new Error(`AI returned invalid JSON. Raw: "${result.content.slice(0, 200)}"`);
    }
    const candidates = parseAIResponse(parsed);

    console.info(
      `[image] OK — model=${result.model}, ${candidates.length} candidates, ${Date.now() - startTime}ms`,
    );
    return NextResponse.json({
      success: true,
      data: buildGenerationResponse(candidates, {
        tokensUsed: result.tokensInput + result.tokensOutput,
        fromCache: false,
      }),
    } satisfies ApiResponse<GenerationResponse>);
  } catch (error) {
    const message = (error as Error).message;
    console.error(`[image] FAIL (${Date.now() - startTime}ms):`, message);
    if (message.includes("비전(이미지) 변환")) {
      return err(400, "VISION_UNAVAILABLE", message);
    }
    return err(500, "IMAGE_FAILED", "이미지에서 다이어그램을 만들지 못했습니다. 더 또렷한 이미지를 시도해보세요.");
  }
}

function err(
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
