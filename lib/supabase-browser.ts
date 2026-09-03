"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://skorvsqsyczkqmavjxzg.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_BoLR77pEk8qRYwSAftC00w_BWMxMBYs";
  if (!url || !key) return null;
  browserClient = createClient(url, key);
  return browserClient;
}

export async function checkoutHeaders() {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const client = getSupabaseBrowserClient();
  const session = client ? (await client.auth.getSession()).data.session : null;
  if (session?.access_token) headers.authorization = `Bearer ${session.access_token}`;
  return headers;
}
