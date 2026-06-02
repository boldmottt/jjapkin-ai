"use client";

/**
 * 브라우저용 Supabase 클라이언트
 * 미설정 시 null (인증 비활성).
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./config";

let _client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  if (!_client) {
    _client = createBrowserClient(env.url, env.anonKey);
  }
  return _client;
}
