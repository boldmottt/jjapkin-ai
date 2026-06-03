import "server-only";

/**
 * 서버측 인증 사용자 해석
 *
 * Supabase 세션의 이메일을 우리 Prisma User에 매핑(upsert)한다.
 * 인증/DB 미설정이거나 비로그인 상태면 null.
 */

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  email: string;
}

/** Supabase 세션 이메일 (없으면 null) */
export async function getSessionEmail(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}

/** 로그인한 사용자에 대응하는 Prisma User (없으면 upsert). 비로그인/오류 시 null */
export async function getCurrentUser(): Promise<AppUser | null> {
  const email = await getSessionEmail();
  if (!email) return null;
  if (!prisma) return null;
  try {
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, provider: "email" },
      update: {},
    });
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}
