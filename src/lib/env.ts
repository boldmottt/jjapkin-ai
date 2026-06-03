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
  const raw = {
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
  };

  const parsed = envSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // 중요: 여기서 throw하면 env에 접근하는 모듈 로드/라우트가 통째로 죽어
  // 클라이언트가 JSON 대신 HTML 500을 받게 된다("Unexpected token '<'").
  // → 절대 throw하지 않고, 경고만 남긴 뒤 안전한 폴백 값을 만든다.
  // 실제 키가 필요한 시점(AI 호출 등)에서 각 라우트가 JSON 에러로 안내한다.
  console.warn(
    "⚠️ 환경변수가 누락/형식 오류 — 누락 키는 비활성(빈 값)으로 동작합니다. .env.local 확인:",
    JSON.stringify(parsed.error.flatten().fieldErrors),
  );

  return {
    DEEPSEEK_API_KEY: raw.DEEPSEEK_API_KEY ?? "",
    DEEPSEEK_BASE_URL: raw.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    DEEPSEEK_MODEL: raw.DEEPSEEK_MODEL || "deepseek-chat",
    DEEPSEEK_VISION_MODEL: raw.DEEPSEEK_VISION_MODEL || "deepseek-chat",
    OPENAI_API_KEY: raw.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: raw.ANTHROPIC_API_KEY,
    // url 검증 실패 시 비활성(undefined) 처리 → prisma는 null로 동작
    DATABASE_URL: isUrl(raw.DATABASE_URL) ? raw.DATABASE_URL : undefined,
    DIRECT_URL: isUrl(raw.DIRECT_URL) ? raw.DIRECT_URL : undefined,
    NEXT_PUBLIC_APP_URL: raw.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NEXT_PUBLIC_APP_NAME: raw.NEXT_PUBLIC_APP_NAME || "JJapkin AI",
  };
}

function isUrl(v: string | undefined): v is string {
  if (!v) return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

export const env: Env = new Proxy({} as Env, {
  get(_, prop: string) {
    if (!_envCache) {
      _envCache = loadAndValidate();
    }
    return (_envCache as Record<string, unknown>)[prop];
  },
});
