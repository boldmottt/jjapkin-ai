import { z } from "zod";

/**
 * 환경변수 타입 안전 래퍼 — DeepSeek API 기본
 *
 * API 키가 없어도 서버는 정상 기동되며, 키가 필요한 기능은
 * 런타임에 null 체크 후 graceful fallback 합니다.
 */

export const publicEnv = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "JJapkin AI",
} as const;

/** 서버 환경변수 — 모두 optional, 런타임에서 필요 시 체크 */
export const env = {
  // DeepSeek (기본 AI)
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  // OpenAI (대체)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  // Anthropic (대체)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  // DB
  DATABASE_URL: process.env.DATABASE_URL || "",
  DIRECT_URL: process.env.DIRECT_URL || "",
  // 앱
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "JJapkin AI",
} as const;
