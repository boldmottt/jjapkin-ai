/**
 * Supabase 설정 헬퍼
 *
 * 환경변수가 없으면 null을 반환해, 인증 미설정 환경에서도 앱이
 * 익명(anon) 모드로 그대로 동작하도록 한다.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
