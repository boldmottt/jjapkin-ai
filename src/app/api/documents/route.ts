/**
 * 문서 영속화 API
 *
 *   PUT /api/documents  — 문서(텍스트/제목) + 선택된 다이어그램 저장 (auto-save)
 *   GET /api/documents  — documentId로 문서 + 다이어그램 불러오기
 *
 * 소유자 해석:
 *   1) 로그인 상태면 Supabase 세션의 사용자(Prisma User)
 *   2) 아니면 브라우저별 anonId 기반 익명 User (localStorage)
 * 로그인 시 익명 문서는 /api/documents/claim 으로 계정에 이전된다.
 *
 * DB/인증 미설정이거나 오류면 auto-save를 막지 않도록 graceful 처리한다.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

interface SaveDiagram {
  sourceText: string;
  diagramType: string;
  data: unknown; // { ir, elements }
}

interface SaveBody {
  documentId?: string;
  anonId?: string;
  title?: string;
  rawText?: string;
  diagram?: SaveDiagram | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PUT 요청 본문 최대 크기 (약 1MB) */
const MAX_BODY_BYTES = 1_000_000;

function anonEmail(anonId: string): string {
  return `anon:${anonId}`;
}

/** 현재 요청의 문서 소유자 id를 해석. 로그인 사용자 우선, 없으면 익명 */
async function resolveOwnerId(
  anonId: string | undefined,
  opts: { createAnon: boolean },
): Promise<string | null> {
  if (!prisma) return null;

  const authed = await getCurrentUser();
  if (authed) return authed.id;

  if (!anonId || !UUID_RE.test(anonId)) return null;
  const email = anonEmail(anonId);
  if (opts.createAnon) {
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, provider: "anon" },
      update: {},
    });
    return user.id;
  }
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user?.id ?? null;
}

// ── 저장 ────────────────────────────────────────────

export async function PUT(request: Request) {
  // IP 기반 레이트리밋 (분당 10회)
  const ip = getClientIp(request);
  const limit = checkRateLimit(`documents:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT",
          message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  let body: SaveBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_JSON", message: "잘못된 요청입니다." },
      },
      { status: 400 },
    );
  }

  // 요청 본문 크기 제한
  if (JSON.stringify(body).length > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "문서가 너무 큽니다.",
        },
      },
      { status: 413 },
    );
  }

  const {
    documentId,
    anonId,
    title = "Untitled",
    rawText = "",
    diagram,
  } = body;
  if (!documentId || !UUID_RE.test(documentId)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_ID", message: "documentId가 필요합니다." },
      },
      { status: 400 },
    );
  }

  if (!prisma) {
    return NextResponse.json({ success: true, persisted: false });
  }

  try {
    const ownerId = await resolveOwnerId(anonId, { createAnon: true });
    if (!ownerId) {
      return NextResponse.json({ success: true, persisted: false });
    }

    // 소유권 확인: 다른 소유자의 문서면 덮어쓰기 거부
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
      select: { userId: true },
    });
    if (existing && existing.userId !== ownerId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "권한이 없습니다." },
        },
        { status: 403 },
      );
    }

    await prisma.document.upsert({
      where: { id: documentId },
      create: { id: documentId, userId: ownerId, title, rawText },
      update: { title, rawText },
    });

    if (diagram) {
      // 현재 선택된 단일 다이어그램만 보존 (replace)
      await prisma.visual.deleteMany({ where: { documentId } });
      await prisma.visual.create({
        data: {
          documentId,
          sourceText: diagram.sourceText,
          diagramType: diagram.diagramType,
          excalidrawData: diagram.data as object,
          sortOrder: 0,
        },
      });
    }

    return NextResponse.json({ success: true, persisted: true });
  } catch (error) {
    console.warn("[documents] save skipped:", (error as Error).message);
    return NextResponse.json({ success: true, persisted: false });
  }
}

// ── 불러오기 ────────────────────────────────────────

export async function GET(request: Request) {
  // IP 기반 레이트리밋 (분당 10회)
  const ip = getClientIp(request);
  const limit = checkRateLimit(`documents:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT",
          message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  const url = new URL(request.url);
  const documentId = url.searchParams.get("documentId");
  const anonId = url.searchParams.get("anonId") ?? undefined;

  if (!documentId || !UUID_RE.test(documentId)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_ID", message: "documentId가 필요합니다." },
      },
      { status: 400 },
    );
  }

  if (!prisma) {
    return NextResponse.json({ success: true, found: false });
  }

  try {
    const ownerId = await resolveOwnerId(anonId, { createAnon: false });
    if (!ownerId) {
      return NextResponse.json({ success: true, found: false });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { visuals: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });

    // 없거나 소유자가 다르면 found:false
    if (!document || document.userId !== ownerId) {
      return NextResponse.json({ success: true, found: false });
    }

    const visual = document.visuals[0];
    return NextResponse.json({
      success: true,
      found: true,
      document: {
        title: document.title,
        rawText: document.rawText ?? "",
        diagram: visual
          ? {
              sourceText: visual.sourceText,
              diagramType: visual.diagramType,
              data: visual.excalidrawData,
            }
          : null,
      },
    });
  } catch (error) {
    console.warn("[documents] load skipped:", (error as Error).message);
    return NextResponse.json({ success: true, found: false });
  }
}
