import { PrismaClient } from "@prisma/client";

/**
 * 싱글톤 Prisma 클라이언트
 * Next.js dev 모드에서 HMR이 Prisma 인스턴스를 중복 생성하는 걸 방지
 *
 * DATABASE_URL 환경변수가 없으면 null을 반환합니다.
 * 사용처에서는 반드시 null 체크를 해야 합니다.
 *
 * 사용법:
 *   import { prisma } from "@lib/db/prisma";
 *   const user = prisma ? await prisma.user.findUnique(...) : null;
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

function createClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
