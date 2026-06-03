"use client";

/**
 * 헤더 인증 버튼
 *
 * - 인증 미설정 시 아무것도 렌더링하지 않음 (앱은 익명 모드)
 * - 비로그인: "로그인" 링크
 * - 로그인: 이메일 표시 + 로그아웃, 그리고 익명 문서 1회 claim
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getStoredAnonId } from "@/lib/persistence";

export function AuthButton() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // 로그인 상태가 되면 익명 문서를 계정으로 1회 이전
  useEffect(() => {
    if (!email) return;
    const anonId = getStoredAnonId();
    if (!anonId) return;
    const flag = `jjapkin:claimed:${anonId}`;
    if (localStorage.getItem(flag)) return;

    fetch("/api/documents/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonId }),
    })
      .then(() => localStorage.setItem(flag, "1"))
      .catch(() => {
        /* best-effort */
      });
  }, [email]);

  if (!supabase) return null;

  if (!ready) {
    return <div className="h-7 w-16 animate-pulse rounded bg-muted" />;
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="hidden max-w-[160px] truncate text-muted-foreground sm:inline">
        {email}
      </span>
      <button
        onClick={() => supabase.auth.signOut()}
        className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors hover:border-primary/50"
        aria-label="로그아웃"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">로그아웃</span>
      </button>
    </div>
  );
}
