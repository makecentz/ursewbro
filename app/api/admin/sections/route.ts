import { env } from "cloudflare:workers";
import { defaultSiteContent, type SiteContent } from "../../../../lib/site-content";
import { getAdminForRequest } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const runtime = env as unknown as { ADMIN_EMAIL?: string; DB?: D1Database };
  if (!await getAdminForRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!runtime.DB) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const form = await request.json() as Record<string, unknown>;
  const sectionKey = String(form.sectionKey || "") as keyof SiteContent;
  if (!defaultSiteContent[sectionKey]) return Response.json({ error: "Unknown section" }, { status: 400 });
  const title = String(form.title || "").trim().slice(0, 180);
  const subtitle = String(form.subtitle || "").trim().slice(0, 180);
  const body = String(form.body || "").trim().slice(0, 600);
  if (!title || !subtitle || !body) return Response.json({ error: "All fields are required" }, { status: 400 });
  await runtime.DB.prepare("INSERT INTO site_sections (section_key, title, subtitle, body, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(section_key) DO UPDATE SET title = excluded.title, subtitle = excluded.subtitle, body = excluded.body, updated_at = excluded.updated_at").bind(sectionKey, title, subtitle, body, Date.now()).run();
  return Response.json({ ok: true });
}
