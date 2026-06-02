/**
 * POST /api/documents/claim
 *
 * 로그인 직후, 브라우저의 익명(anonId) 소유 문서를 현재 로그인 계정으로
 * 이전한다. 익명 User의 문서 userId를 로그인 User로 재할당한 뒤 익명 User를
 * 정리한다.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let anonId: string | undefined;
  try {
    ({ anonId } = await request.json());
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_JSON", message: "잘못된 요청입니다." },
      },
      { status: 400 },
    );
  }

  if (!anonId || !UUID_RE.test(anonId)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_ID", message: "anonId가 필요합니다." },
      },
      { status: 400 },
    );
  }

  if (!prisma) {
    return NextResponse.json({ success: true, claimed: 0 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "로그인이 필요합니다.",
          },
        },
        { status: 401 },
      );
    }

    const anon = await prisma.user.findUnique({
      where: { email: `anon:${anonId}` },
      select: { id: true },
    });
    if (!anon || anon.id === user.id) {
      return NextResponse.json({ success: true, claimed: 0 });
    }

    const result = await prisma.document.updateMany({
      where: { userId: anon.id },
      data: { userId: user.id },
    });

    // 비어버린 익명 User 정리 (실패해도 무시)
    await prisma.user.delete({ where: { id: anon.id } }).catch(() => {});

    return NextResponse.json({ success: true, claimed: result.count });
  } catch (error) {
    console.warn("[documents/claim] failed:", (error as Error).message);
    return NextResponse.json({ success: true, claimed: 0 });
  }
}
