/**
 * AI 생성 결과 캐싱 레이어
 *
 * 동일한 텍스트 + 다이어그램 유형 조합에 대해
 * AI API(DeepSeek → OpenAI → Claude) 중복 호출을 방지합니다.
 *
 * 캐싱 전략:
 *   - SHA256(text + diagramType) 해시로 Prisma GenerationCache 조회
 *   - TTL: 7일 (만료 후 재생성)
 *   - 캐시 히트 시 tokensUsed=0, fromCache=true
 */

import { prisma } from "@/lib/db/prisma";
import type { GenerationCandidate, DiagramType } from "@/types";
import { createHash } from "node:crypto";

/** SHA256 해시 */
function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

// ── 캐시 키 생성 ───────────────────────────────────

function buildCacheKey(text: string, diagramType?: DiagramType): string {
  const key = diagramType ? `${diagramType}:${text}` : text;
  return sha256(key);
}

// ── 캐시 읽기 ──────────────────────────────────────

interface CacheEntry {
  candidates: GenerationCandidate[];
  modelUsed: string;
  tokensUsed: number;
}

export async function getCachedResult(
  text: string,
  diagramType?: DiagramType,
): Promise<CacheEntry | null> {
  if (!prisma) {
    // Prisma 클라이언트가 없는 환경 (빌드 타임 등)
    return null;
  }

  try {
    const hash = buildCacheKey(text, diagramType);
    const cached = await prisma.generationCache.findUnique({
      where: { textHash: hash },
    });

    if (!cached) return null;

    // TTL 체크
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      // 만료된 캐시는 삭제 (비동기, 결과 기다리지 않음)
      prisma.generationCache.delete({ where: { id: cached.id } }).catch(() => {});
      return null;
    }

    return {
      candidates: cached.resultJson as unknown as GenerationCandidate[],
      modelUsed: cached.modelUsed ?? "unknown",
      tokensUsed: cached.tokensUsed ?? 0,
    };
  } catch (error) {
    // DB 오류는 조용히 무시 (캐시 없이 생성 진행)
    console.warn("[cache] Read failed, skipping cache:", (error as Error).message);
    return null;
  }
}

// ── 캐시 쓰기 ──────────────────────────────────────

export async function setCachedResult(
  text: string,
  diagramType: DiagramType,
  candidates: GenerationCandidate[],
  opts: {
    modelUsed: string;
    tokensUsed: number;
  },
): Promise<void> {
  if (!prisma) return;

  try {
    const hash = buildCacheKey(text, diagramType);
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

    await prisma.generationCache.upsert({
      where: { textHash: hash },
      create: {
        textHash: hash,
        diagramType,
        resultJson: candidates as unknown as object,
        modelUsed: opts.modelUsed,
        tokensUsed: opts.tokensUsed,
        expiresAt,
      },
      update: {
        resultJson: candidates as unknown as object,
        modelUsed: opts.modelUsed,
        tokensUsed: opts.tokensUsed,
        expiresAt,
      },
    });
  } catch (error) {
    console.warn("[cache] Write failed, continuing without cache:", (error as Error).message);
  }
}

// ── 캐시 통계 (디버깅용) ───────────────────────────

export async function getCacheStats(): Promise<{
  totalEntries: number;
  oldestEntry: Date | null;
}> {
  if (!prisma) return { totalEntries: 0, oldestEntry: null };

  try {
    const [count, oldest] = await Promise.all([
      prisma.generationCache.count(),
      prisma.generationCache.findFirst({
        orderBy: { cachedAt: "asc" },
        select: { cachedAt: true },
      }),
    ]);
    return { totalEntries: count, oldestEntry: oldest?.cachedAt ?? null };
  } catch {
    return { totalEntries: 0, oldestEntry: null };
  }
}
