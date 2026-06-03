/**
 * 매직링크 콜백
 *
 * 이메일 링크의 ?code= 를 세션으로 교환한 뒤 next(기본 /editor)로 리다이렉트.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/editor";

  if (code) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, url.origin));
      }
      console.warn("[auth/callback] exchange failed:", error.message);
    }
  }

  // 실패 시 로그인 페이지로
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
