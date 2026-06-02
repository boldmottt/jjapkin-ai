import "server-only";

/**
 * 서버용 Supabase 클라이언트 (route handler / server component)
 * Next 14의 동기 cookies()를 사용. 미설정 시 null.
 */

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./config";

export function createSupabaseServerClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 호출되면 set이 불가 → 미들웨어가 갱신 담당
        }
      },
    },
  });
}
