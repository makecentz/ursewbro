import { createClient } from "@supabase/supabase-js";

type PrintifyOrder = {
  id: string;
  status?: string;
  total_price?: number;
  created_at?: string;
  address_to?: { first_name?: string; last_name?: string; email?: string };
};

const defaultContent = {
  announcement: { title: "LIMITED RELEASES. MADE DIFFERENT.", subtitle: "READY TO WEAR • UPCYCLED • HAND FINISHED", body: "NEW DROPS AVAILABLE" },
  hero: { title: "YOU WEAR CLOTHES. WE MAKE PIECES.", subtitle: "PRE-MADE • CREATIVE • READY TO WEAR", body: "Ready-to-wear denim, upcycled streetwear, and limited-run pieces from Vivlox." },
  about: { title: "NOT MASS PRODUCED. MADE DIFFERENT.", subtitle: "ABOUT VIVLOX", body: "Vivlox creates limited-run clothing with bold silhouettes and hand-finished details." },
  newsletter: { title: "DON’T MISS THE NEXT DROP.", subtitle: "DROP ALERTS", body: "Limited drops don’t always restock." },
};

async function authorized(request: { headers: { authorization?: string } }) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!token || !url || !secret || !adminEmail) return null;
  const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || data.user?.email?.toLowerCase() !== adminEmail.toLowerCase()) return null;
  return client;
}

export default async function handler(request: { headers: { authorization?: string } }, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  const supabase = await authorized(request);
  if (!supabase) return response.status(401).json({ error: "Unauthorized" });

  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  let productCount = 0;
  let orders: Array<{ id: string; status: string; total: number; createdAt: string; customerName: string; customerEmail: string }> = [];

  if (token && shopId) {
    const headers = { Authorization: `Bearer ${token}`, "User-Agent": "Vivlox Website" };
    const [productsResult, ordersResult] = await Promise.all([
      fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=50`, { headers }),
      fetch(`https://api.printify.com/v1/shops/${shopId}/orders.json?limit=50`, { headers }),
    ]);
    if (productsResult.ok) productCount = ((await productsResult.json() as { data?: unknown[] }).data || []).length;
    if (ordersResult.ok) {
      const payload = await ordersResult.json() as { data?: PrintifyOrder[] };
      orders = (payload.data || []).map((order) => ({
        id: order.id,
        status: order.status || "unknown",
        total: Number(order.total_price || 0) / 100,
        createdAt: order.created_at || "",
        customerName: [order.address_to?.first_name, order.address_to?.last_name].filter(Boolean).join(" ") || "Customer",
        customerEmail: order.address_to?.email || "—",
      }));
    }
  }

  const { data: sections } = await supabase.from("site_sections").select("section_key,eyebrow,headline,body");
  const content = structuredClone(defaultContent);
  for (const row of sections || []) {
    if (row.section_key in content) content[row.section_key as keyof typeof content] = { title: row.headline, subtitle: row.eyebrow, body: row.body };
  }

  return response.status(200).json({ orders, productCount, printifyConnected: Boolean(token && shopId), content });
}
