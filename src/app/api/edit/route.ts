/**
 * POST /api/edit
 *
 * 선택한 다이어그램 객체 + 자연어 지시 → AI가 제한된 편집 op(JSON) 반환.
 * 적용은 클라이언트(applyEditOps)가 수행한다.
 */
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { chatCompletionWithFallback } from "@/lib/ai/openai";
import { buildEditMessages } from "@/lib/ai/prompts";
import { parseEditResponse } from "@/lib/ai/edit-parser";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface EditSelectionItem {
  id: string;
  type?: string;
  label?: string;
  backgroundColor?: string;
}

interface EditRequest {
  instruction?: string;
  selection?: EditSelectionItem[];
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`edit:${ip}`);
    if (!limit.ok) {
      return err(429, "RATE_LIMIT", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", {
        "Retry-After": String(limit.retryAfter),
      });
    }

    const body: EditRequest = await request.json();
    const instruction = (body.instruction ?? "").trim();
    const selection = Array.isArray(body.selection) ? body.selection : [];

    if (instruction.length < 2) {
      return err(400, "MISSING_INSTRUCTION", "수정 지시를 입력해주세요.");
    }
    if (selection.length === 0) {
      return err(400, "NO_SELECTION", "수정할 객체를 먼저 선택해주세요.");
    }
    if (instruction.length > 300) {
      return err(400, "INSTRUCTION_TOO_LONG", "지시가 너무 깁니다(최대 300자).");
    }

    const summary = selection
      .slice(0, 30)
      .map(
        (s, i) =>
          `${i + 1}. type=${s.type ?? "?"}${s.label ? ` label="${s.label}"` : ""}${
            s.backgroundColor ? ` fill=${s.backgroundColor}` : ""
          }`,
      )
      .join("\n");

    const { system, user } = buildEditMessages(instruction, summary);
    const result = await chatCompletionWithFallback({
      systemPrompt: system,
      userMessage: user,
      temperature: 0.2,
      maxTokens: 600,
      responseFormat: "json",
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      throw new Error(`AI returned invalid JSON. Raw: "${result.content.slice(0, 200)}"`);
    }
    const ops = parseEditResponse(parsed);

    console.info(`[edit] OK — ${ops.length} ops, ${Date.now() - startTime}ms`);
    return NextResponse.json({ success: true, data: { ops } } satisfies ApiResponse<{
      ops: typeof ops;
    }>);
  } catch (error) {
    const message = (error as Error).message;
    console.error(`[edit] FAIL (${Date.now() - startTime}ms):`, message);
    if (message.includes("401") || message.includes("Incorrect API key")) {
      return err(500, "SERVICE_UNAVAILABLE", "일시적으로 AI 수정 서비스를 사용할 수 없습니다.");
    }
    if (message.includes("validation failed")) {
      return err(422, "EDIT_INVALID", "지시를 적용 가능한 수정으로 해석하지 못했습니다. 더 구체적으로 입력해보세요.");
    }
    return err(500, "EDIT_FAILED", "AI 수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
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
