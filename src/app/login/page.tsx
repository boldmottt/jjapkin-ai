"use client";

/**
 * 매직링크 로그인 페이지
 *
 * 이메일을 입력하면 Supabase가 로그인 링크를 보내고, 링크의 코드를
 * /auth/callback 에서 세션으로 교환한다.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setStatus("sending");
    setMessage(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=/editor`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 홈으로
        </Link>

        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          이메일로 로그인 링크를 보내드립니다. 비밀번호가 필요 없습니다.
        </p>

        {!supabase ? (
          <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
            인증이 아직 설정되지 않았습니다. (NEXT_PUBLIC_SUPABASE_URL /
            NEXT_PUBLIC_SUPABASE_ANON_KEY) 로그인 없이도 작업은 이 브라우저에
            저장됩니다.
          </p>
        ) : status === "sent" ? (
          <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm">
            <Mail className="mb-2 h-5 w-5 text-primary" />
            <p className="font-medium">메일을 확인하세요</p>
            <p className="mt-1 text-muted-foreground">
              {email} 로 로그인 링크를 보냈습니다. 링크를 클릭하면 자동으로
              로그인됩니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
            >
              {status === "sending" ? "전송 중..." : "로그인 링크 받기"}
            </button>
            {status === "error" && message && (
              <p className="text-xs text-destructive">{message}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
