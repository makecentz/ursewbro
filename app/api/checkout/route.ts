import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { orders } from "../../../db/schema";

type CheckoutItem = { id: string; name: string; price: number; meta: string; qty: number };

export async function POST(request: Request) {
  const stripeKey = (env as unknown as { STRIPE_SECRET_KEY?: string }).STRIPE_SECRET_KEY;
  if (!stripeKey) return Response.json({ error: "Secure checkout is ready for the owner’s Stripe key." }, { status: 503 });
  const body = await request.json() as { items?: CheckoutItem[] };
  const items = (body.items || []).filter((x) => x.qty > 0 && x.price > 0).slice(0, 20);
  if (!items.length) return Response.json({ error: "Your bag is empty." }, { status: 400 });
  const params = new URLSearchParams();
  params.set("mode", "payment"); params.set("success_url", `${new URL(request.url).origin}/?checkout=success`); params.set("cancel_url", `${new URL(request.url).origin}/?checkout=cancelled`);
  params.set("allow_promotion_codes", "true"); params.set("billing_address_collection", "required"); params.set("shipping_address_collection[allowed_countries][0]", "US");
  items.forEach((item, index) => { params.set(`line_items[${index}][price_data][currency]`, "usd"); params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.price * 100))); params.set(`line_items[${index}][price_data][product_data][name]`, item.name); params.set(`line_items[${index}][price_data][product_data][description]`, item.meta); params.set(`line_items[${index}][quantity]`, String(item.qty)); });
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${stripeKey}`, "content-type": "application/x-www-form-urlencoded" }, body: params });
  const session = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !session.id || !session.url) return Response.json({ error: session.error?.message || "Checkout could not start." }, { status: 502 });
  const now = new Date();
  await getDb().insert(orders).values({ id: crypto.randomUUID(), status: "AWAITING_PAYMENT", type: items.some(x=>x.id.startsWith("package-")) ? "CUSTOM" : "SHOP", totalCents: items.reduce((n,x)=>n+Math.round(x.price*100)*x.qty,0), stripeSessionId: session.id, createdAt: now, updatedAt: now });
  return Response.json({ url: session.url });
}
