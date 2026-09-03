import { env } from "cloudflare:workers";

export type SiteContent = {
  announcement: { title: string; subtitle: string; body: string };
  hero: { title: string; subtitle: string; body: string };
  about: { title: string; subtitle: string; body: string };
  newsletter: { title: string; subtitle: string; body: string };
};

export const defaultSiteContent: SiteContent = {
  announcement: { title: "LIMITED RELEASES. MADE DIFFERENT.", subtitle: "READY TO WEAR • UPCYCLED • HAND FINISHED", body: "NEW DROPS AVAILABLE" },
  hero: { title: "YOU WEAR CLOTHES. WE MAKE PIECES.", subtitle: "PRE-MADE • CREATIVE • READY TO WEAR", body: "Ready-to-wear denim, upcycled streetwear, and limited-run pieces from Vivlox." },
  about: { title: "NOT MASS PRODUCED. MADE DIFFERENT.", subtitle: "ABOUT VIVLOX", body: "Vivlox creates limited-run clothing with bold silhouettes, hand-finished details, and a point of view you won’t find on every rack." },
  newsletter: { title: "DON’T MISS THE NEXT DROP.", subtitle: "DROP ALERTS", body: "Limited drops don’t always restock." },
};

export async function getSiteContent(): Promise<SiteContent> {
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) return defaultSiteContent;
  try {
    const result = await database.prepare("SELECT section_key, title, subtitle, body FROM site_sections").all() as { results?: Array<{ section_key: string; title: string; subtitle: string; body: string }> };
    const content = structuredClone(defaultSiteContent);
    for (const row of result.results || []) {
      if (row.section_key in content) content[row.section_key as keyof SiteContent] = { title: row.title, subtitle: row.subtitle, body: row.body };
    }
    return content;
  } catch {
    return defaultSiteContent;
  }
}
