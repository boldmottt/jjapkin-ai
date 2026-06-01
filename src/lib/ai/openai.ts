/**
 * DeepSeek AI 클라이언트 (OpenAI SDK 호환)
 *
 * DeepSeek API는 OpenAI SDK와 100% 호환됩니다.
 * 기본 모델: deepseek-chat (deepseek-v4-pro)
 * 대체: OpenAI GPT-4o-mini, Anthropic Claude 3.5 Sonnet
 */

import OpenAI from "openai";
import { env } from "@/lib/env";

// ── DeepSeek 클라이언트 (기본) ─────────────────────

let _deepseekClient: OpenAI | null = null;

export function getDeepSeekClient(): OpenAI {
  if (!_deepseekClient) {
    _deepseekClient = new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: `${env.DEEPSEEK_BASE_URL}/v1`,
      timeout: 30_000,
      maxRetries: 2,
    });
  }
  return _deepseekClient;
}

// ── OpenAI 클라이언트 (대체) ──────────────────────

let _openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  if (!_openaiClient) {
    _openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: 30_000,
      maxRetries: 2,
    });
  }
  return _openaiClient;
}

// ── Anthropic 대체 ─────────────────────────────────

export function hasAnthropicKey(): boolean {
  return !!env.ANTHROPIC_API_KEY;
}

// ── 타입 ──────────────────────────────────────────

export interface ChatCompletionOptions {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
}

// ── 핵심 API ──────────────────────────────────────

/**
 * DeepSeek 채팅 완성 (기본)
 */
export async function chatCompletion(
  opts: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  const client = getDeepSeekClient();
  const model = opts.model ?? env.DEEPSEEK_MODEL;

  const response = await client.chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 2000,
    messages: [
      { role: "system", content: opts.systemPrompt },
      { role: "user", content: opts.userMessage },
    ],
    ...(opts.responseFormat === "json"
      ? { response_format: { type: "json_object" } }
      : {}),
  });

  const choice = response.choices[0];
  if (!choice?.message?.content) {
    throw new Error("DeepSeek returned empty response");
  }

  return {
    content: choice.message.content,
    model: response.model,
    tokensInput: response.usage?.prompt_tokens ?? 0,
    tokensOutput: response.usage?.completion_tokens ?? 0,
  };
}

/**
 * DeepSeek 실패 → OpenAI 폴백 → Anthropic 폴백
 */
export async function chatCompletionWithFallback(
  opts: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  // 1차: DeepSeek
  try {
    return await chatCompletion(opts);
  } catch (deepseekError) {
    console.warn(
      "[ai] DeepSeek failed:",
      (deepseekError as Error).message,
    );
  }

  // 2차: OpenAI
  const openaiClient = getOpenAIClient();
  if (openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 2000,
        messages: [
          { role: "system", content: opts.systemPrompt },
          { role: "user", content: opts.userMessage },
        ],
        ...(opts.responseFormat === "json"
          ? { response_format: { type: "json_object" } }
          : {}),
      });

      const choice = response.choices[0];
      if (choice?.message?.content) {
        return {
          content: choice.message.content,
          model: response.model,
          tokensInput: response.usage?.prompt_tokens ?? 0,
          tokensOutput: response.usage?.completion_tokens ?? 0,
        };
      }
    } catch (openaiError) {
      console.warn(
        "[ai] OpenAI fallback failed:",
        (openaiError as Error).message,
      );
    }
  }

  // 3차: Anthropic
  if (hasAnthropicKey()) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: opts.maxTokens ?? 2000,
        system: opts.systemPrompt,
        messages: [{ role: "user", content: opts.userMessage }],
      });

      const textBlock = msg.content.find((b) => b.type === "text");
      if (textBlock && textBlock.type === "text") {
        return {
          content: textBlock.text,
          model: msg.model,
          tokensInput: msg.usage?.input_tokens ?? 0,
          tokensOutput: msg.usage?.output_tokens ?? 0,
        };
      }
    } catch (anthropicError) {
      console.warn(
        "[ai] Anthropic fallback failed:",
        (anthropicError as Error).message,
      );
    }
  }

  throw new Error("All AI providers failed (DeepSeek → OpenAI → Anthropic)");
}
