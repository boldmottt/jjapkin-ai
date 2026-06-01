// ── lib 배럴 파일 ──────────────────────────────────
// 모든 lib 모듈은 여기서 re-export 됩니다.

// Utils
export { cn } from "./utils/cn";

// DB
export { prisma } from "./db/prisma";

// Env
export { env, publicEnv } from "./env";

// AI 관련 (향후 추가)
// export { generateDiagram } from "./ai/generate";
// export { parseTextToIR } from "./ai/parser";
