import { createClient } from "@supabase/supabase-js";

export default async function handler(request: { method?: string; headers: { authorization?: string }; body?: Record<string, unknown> }, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!token || !url || !secret || !adminEmail) return response.status(401).json({ error: "Unauthorized" });

  const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || data.user?.email?.toLowerCase() !== adminEmail.toLowerCase()) return response.status(401).json({ error: "Unauthorized" });

  const form = request.body;
  if (!form) return response.status(400).json({ error: "Invalid form" });
  const sectionKey = String(form.sectionKey || "");
  if (!/^[a-z][a-z0-9_]{1,49}$/.test(sectionKey)) return response.status(400).json({ error: "Invalid section" });

  const { error: saveError } = await supabase.from("site_sections").upsert({
    section_key: sectionKey,
    eyebrow: String(form.subtitle || "").slice(0, 500),
    headline: String(form.title || "").slice(0, 500),
    body: String(form.body || "").slice(0, 5000),
    updated_at: new Date().toISOString(),
  });
  if (saveError) return response.status(500).json({ error: "Save failed" });
  return response.status(200).json({ ok: true });
}
