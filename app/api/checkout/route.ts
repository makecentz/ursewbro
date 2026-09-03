import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { orders } from "../../../db/schema";
import { getStoreProduct } from "../../../lib/printify";

type RequestedItem = { id?: string; variantId?: string | number; qty?: number };
type CheckoutItem = { productId: string; variantId: number; name: string; variantName: string; unitAmount: number; quantity: number };

export async function POST(request: Request) {
  const stripeKey = (env as unknown as { STRIPE_SECRET_KEY?: string }).STRIPE_SECRET_KEY;
  if (!stripeKey) return Response.json({ error: "Checkout is waiting for the store’s Stripe connection." }, { status: 503 });

  const body = await request.json() as { items?: RequestedItem[] };
  const requested = (body.items || []).slice(0, 20);
  if (!requested.length) return Response.json({ error: "Your bag is empty." }, { status: 400 });

  const validated: CheckoutItem[] = [];
  for (const item of requested) {
    const quantity = Math.max(1, Math.min(10, Math.floor(Number(item.qty) || 1)));
    const product = item.id ? await getStoreProduct(item.id) : null;
    const variant = product?.variants?.find((entry) => String(entry.id) === String(item.variantId) && entry.available);
    if (!product || product.source !== "printify" || !variant || variant.price <= 0) {
      return Response.json({ error: "One of these products or sizes is no longer available. Refresh the page and try again." }, { status: 409 });
    }
    validated.push({ productId:product.id, variantId:Number(variant.id), name:product.name, variantName:variant.title, unitAmount:Math.round(variant.price * 100), quantity });
  }

  const orderId = crypto.randomUUID();
  const now = new Date();
  const totalCents = validated.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  const db = getDb();
  await db.insert(orders).values({ id:orderId, status:"AWAITING_PAYMENT", type:"SHOP", totalCents, itemsJson:JSON.stringify(validated), createdAt:now, updatedAt:now });

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", orderId);
  params.set("metadata[order_id]", orderId);
  params.set("customer_creation", "always");
  params.set("success_url", `${new URL(request.url).origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${new URL(request.url).origin}/?checkout=cancelled`);
  params.set("allow_promotion_codes", "true");
  params.set("billing_address_collection", "required");
  params.set("phone_number_collection[enabled]", "true");
  params.set("shipping_address_collection[allowed_countries][0]", "US");
  validated.forEach((item, index) => {
    params.set(`line_items[${index}][price_data][currency]`, "usd");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
    params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
    params.set(`line_items[${index}][price_data][product_data][description]`, item.variantName);
    params.set(`line_items[${index}][quantity]`, String(item.quantity));
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method:"POST", headers:{ authorization:`Bearer ${stripeKey}`, "content-type":"application/x-www-form-urlencoded" }, body:params });
  const session = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !session.id || !session.url) {
    await db.update(orders).set({ status:"CHECKOUT_ERROR", updatedAt:new Date() }).where(eq(orders.id, orderId));
    return Response.json({ error:session.error?.message || "Checkout could not start." }, { status:502 });
  }
  await db.update(orders).set({ stripeSessionId:session.id, updatedAt:new Date() }).where(eq(orders.id, orderId));
  return Response.json({ url:session.url });
}
