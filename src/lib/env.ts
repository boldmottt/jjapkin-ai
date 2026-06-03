import { z } from "zod";

/**
 * 환경변수 타입 안전 래퍼 — DeepSeek API 기본
 */

export const publicEnv = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "JJapkin AI",
} as const;

const envSchema = z.object({
  // DeepSeek (기본 AI)
  DEEPSEEK_API_KEY: z.string().min(1),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-chat"),
  // DeepSeek 비전 모델 (이미지→다이어그램). 기본은 chat 모델과 동일하게 두되
  // 비전 전용 모델이 있으면 이 값으로 지정한다.
  DEEPSEEK_VISION_MODEL: z.string().default("deepseek-chat"),
  // OpenAI (대체)
  OPENAI_API_KEY: z.string().optional(),
  // Anthropic (대체)
  ANTHROPIC_API_KEY: z.string().optional(),
  // DB
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  // 앱
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("JJapkin AI"),
});

type Env = z.infer<typeof envSchema>;

let _envCache: Env | null = null;

function loadAndValidate(): Env {
  const parsed = envSchema.safeParse({
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
    DEEPSEEK_VISION_MODEL: process.env.DEEPSEEK_VISION_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(parsed.error.format(), null, 2),
    );
    throw new Error("Invalid environment variables. Check .env.local");
  }

  return parsed.data;
}

export const env: Env = new Proxy({} as Env, {
  get(_, prop: string) {
    if (!_envCache) {
      _envCache = loadAndValidate();
    }
    return (_envCache as Record<string, unknown>)[prop];
  },
});
