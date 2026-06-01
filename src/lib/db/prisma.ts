import { PrismaClient } from "@prisma/client";

/**
 * 싱글톤 Prisma 클라이언트
 * Next.js dev 모드에서 HMR이 Prisma 인스턴스를 중복 생성하는 걸 방지
 *
 * 사용법:
 *   import { prisma } from "@lib/db/prisma";
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
