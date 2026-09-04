import { createClient } from "@supabase/supabase-js";

const defaultContent = {
  announcement: { title: "LIMITED RELEASES. MADE DIFFERENT.", subtitle: "READY TO WEAR • UPCYCLED • HAND FINISHED", body: "NEW DROPS AVAILABLE" },
  hero: { title: "YOU WEAR CLOTHES. WE MAKE PIECES.", subtitle: "PRE-MADE • CREATIVE • READY TO WEAR", body: "Ready-to-wear denim, upcycled streetwear, and limited-run pieces from Vivlox." },
  about: { title: "NOT MASS PRODUCED. MADE DIFFERENT.", subtitle: "ABOUT VIVLOX", body: "Vivlox creates limited-run clothing with bold silhouettes and hand-finished details." },
  newsletter: { title: "DON’T MISS THE NEXT DROP.", subtitle: "DROP ALERTS", body: "Limited drops don’t always restock." },
};

export default async function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return response.status(200).json({ content: defaultContent });

  const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase.from("site_sections").select("section_key,eyebrow,headline,body");
  const content = structuredClone(defaultContent);
  for (const row of data || []) {
    if (row.section_key in content) content[row.section_key as keyof typeof content] = { title: row.headline, subtitle: row.eyebrow, body: row.body };
  }
  return response.status(200).json({ content });
}
