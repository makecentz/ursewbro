import { env } from "cloudflare:workers";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseServerClient() {
  const runtime = env as unknown as {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    SUPABASE_SECRET_KEY?: string;
  };
  if (!runtime.NEXT_PUBLIC_SUPABASE_URL || !runtime.SUPABASE_SECRET_KEY) return null;
  return createClient(runtime.NEXT_PUBLIC_SUPABASE_URL, runtime.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
