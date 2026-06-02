/**
 * 문서 영속화 API (익명 소유자 기반)
 *
 *   PUT /api/documents  — 문서(텍스트/제목) + 선택된 다이어그램 저장 (auto-save)
 *   GET /api/documents  — documentId/anonId로 문서 + 다이어그램 불러오기
 *
 * 인증이 없으므로 브라우저별 anonId(localStorage)로 익명 User를 upsert해
 * 소유권을 부여한다. 추후 실제 인증 도입 시 익명 소유자를 연결하면 된다.
 *
 * DB가 없거나 오류가 나면 auto-save를 막지 않도록 graceful하게 처리한다.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function anonEmail(anonId: string): string {
  return `anon:${anonId}`;
}

// ── 저장 ────────────────────────────────────────────

export async function PUT(request: Request) {
  let body: SaveBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BAD_JSON", message: "잘못된 요청입니다." } },
      { status: 400 },
    );
  }

  const { documentId, anonId, title = "Untitled", rawText = "", diagram } = body;
  if (!documentId || !anonId || !UUID_RE.test(documentId) || !UUID_RE.test(anonId)) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_ID", message: "documentId/anonId가 필요합니다." } },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.upsert({
      where: { email: anonEmail(anonId) },
      create: { email: anonEmail(anonId), provider: "anon" },
      update: {},
    });

    // 소유권 확인: 다른 anonId가 만든 문서면 덮어쓰기 거부
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
      select: { userId: true },
    });
    if (existing && existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } },
        { status: 403 },
      );
    }

    await prisma.document.upsert({
      where: { id: documentId },
      create: { id: documentId, userId: user.id, title, rawText },
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
    // auto-save는 best-effort: DB 없거나 오류여도 클라이언트 흐름을 막지 않음
    console.warn("[documents] save skipped:", (error as Error).message);
    return NextResponse.json({ success: true, persisted: false });
  }
}

// ── 불러오기 ────────────────────────────────────────

export async function GET(request: Request) {
  const url = new URL(request.url);
  const documentId = url.searchParams.get("documentId");
  const anonId = url.searchParams.get("anonId");

  if (!documentId || !anonId || !UUID_RE.test(documentId) || !UUID_RE.test(anonId)) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_ID", message: "documentId/anonId가 필요합니다." } },
      { status: 400 },
    );
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        user: { select: { email: true } },
        visuals: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });

    // 없거나 소유자가 다르면 found:false
    if (!document || document.user.email !== anonEmail(anonId)) {
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
