import { env } from "cloudflare:workers";
import { getSupabaseServerClient } from "./supabase-server";

export async function getAdminForRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const allowedEmail = (env as unknown as { ADMIN_EMAIL?: string }).ADMIN_EMAIL;
  const supabase = getSupabaseServerClient();
  if (!token || !allowedEmail || !supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email || data.user.email.toLowerCase() !== allowedEmail.toLowerCase()) return null;
  return data.user;
}
