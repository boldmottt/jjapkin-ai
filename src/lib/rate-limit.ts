/**
 * 인메모리 고정 윈도우 레이트리밋 (best-effort 1차 방어)
 *
 * 주의: 프로세스 메모리에만 저장되므로 서버리스/다중 인스턴스 환경에서는
 * 인스턴스 간 공유되지 않는다. 비용 공격에 대한 완전한 방어가 필요하면
 * @upstash/ratelimit 등 분산 스토어 기반으로 교체해야 한다.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000; // 1분
const MAX_REQUESTS = 10; // 분당 10회
const MAX_BUCKETS = 10_000; // 메모리 폭주 방지 상한

export interface RateLimitResult {
  ok: boolean;
  /** 차단 시 재시도까지 남은 초 */
  retryAfter: number;
  remaining: number;
}

export function checkRateLimit(
  key: string,
  opts: { windowMs?: number; max?: number } = {},
): RateLimitResult {
  const windowMs = opts.windowMs ?? WINDOW_MS;
  const max = opts.max ?? MAX_REQUESTS;
  const now = Date.now();

  // 만료된 버킷이거나 처음 보는 키 → 새 윈도우 시작
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) pruneExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: max - 1 };
  }

  if (existing.count >= max) {
    return {
      ok: false,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
      remaining: 0,
    };
  }

  existing.count += 1;
  return { ok: true, retryAfter: 0, remaining: max - existing.count };
}

function pruneExpired(now: number): void {
  const expired: string[] = [];
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) expired.push(key);
  });
  expired.forEach((key) => buckets.delete(key));
}

/** 요청에서 클라이언트 IP 추정 (프록시 헤더 우선) */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
