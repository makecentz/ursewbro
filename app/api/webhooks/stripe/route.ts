import { env } from "cloudflare:workers";
import { createPrintifyOrder, type FulfillmentItem, type ShippingAddress } from "../../../../lib/printify";

type StripeAddress = { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string };
type StripeSession = {
  id: string; client_reference_id?: string; payment_status?: string; payment_intent?: string; amount_total?: number;
  customer_details?: { email?: string; name?: string; phone?: string; address?: StripeAddress };
  shipping_details?: { name?: string; address?: StripeAddress };
  collected_information?: { shipping_details?: { name?: string; address?: StripeAddress } };
};
type StripeEvent = { id: string; type: string; data: { object: StripeSession } };
type StoredItem = { productId: string; variantId: number; quantity: number };

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
  return signatures.some((signature) => signature.length === expected.length && [...signature].reduce((diff, char, index) => diff | (char.charCodeAt(0) ^ expected.charCodeAt(index)), 0) === 0);
}

function shippingAddress(session: StripeSession): ShippingAddress | null {
  const shipping = session.collected_information?.shipping_details || session.shipping_details;
  const address = shipping?.address || session.customer_details?.address;
  const name = shipping?.name || session.customer_details?.name || "";
  const email = session.customer_details?.email || "";
  if (!address?.line1 || !address.city || !address.postal_code || !address.country || !email) return null;
  const names = name.trim().split(/\s+/);
  return { firstName:names.shift() || "Customer", lastName:names.join(" ") || "Customer", email, phone:session.customer_details?.phone, country:address.country, region:address.state, address1:address.line1, address2:address.line2, city:address.city, zip:address.postal_code };
}

export async function POST(request: Request) {
  const runtime = env as unknown as { DB?: D1Database; STRIPE_WEBHOOK_SECRET?: string };
  if (!runtime.DB || !runtime.STRIPE_WEBHOOK_SECRET) return Response.json({ error:"Webhook is not configured" }, { status:503 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!await validStripeSignature(payload, signature, runtime.STRIPE_WEBHOOK_SECRET)) return Response.json({ error:"Invalid signature" }, { status:400 });

  const event = JSON.parse(payload) as StripeEvent;
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return Response.json({ received:true });
  const session = event.data.object;
  if (session.payment_status !== "paid") return Response.json({ received:true });
  const orderId = session.client_reference_id;
  if (!orderId) return Response.json({ error:"Missing order reference" }, { status:400 });

  const order = await runtime.DB.prepare("SELECT total_cents, items_json, printify_order_id FROM orders WHERE id = ? AND stripe_session_id = ?").bind(orderId, session.id).first() as { total_cents:number; items_json:string | null; printify_order_id:string | null } | null;
  if (!order) return Response.json({ error:"Order not found" }, { status:404 });
  if (order.printify_order_id) return Response.json({ received:true, duplicate:true });
  if (session.amount_total !== order.total_cents) {
    await runtime.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").bind("PAYMENT_REVIEW", Date.now(), orderId).run();
    return Response.json({ received:true, review:true });
  }

  const address = shippingAddress(session);
  if (!address || !order.items_json) return Response.json({ error:"Missing fulfillment details" }, { status:422 });
  const items = JSON.parse(order.items_json) as StoredItem[];
  const claim = await runtime.DB.prepare("UPDATE orders SET status = ?, customer_email = ?, customer_name = ?, shipping_address_json = ?, stripe_payment_intent_id = ?, updated_at = ? WHERE id = ? AND printify_order_id IS NULL AND status IN (?, ?, ?)")
    .bind("FULFILLING", address.email.toLowerCase(), `${address.firstName} ${address.lastName}`, JSON.stringify(address), session.payment_intent || null, Date.now(), orderId, "AWAITING_PAYMENT", "CHECKOUT_ERROR", "FULFILLMENT_ERROR").run();
  if (!claim.meta.changes) return Response.json({ received:true, processing:true });
  try {
    const printify = await createPrintifyOrder(orderId, items as FulfillmentItem[], address);
    if (!printify?.id) throw new Error("Printify did not return an order id");
    await runtime.DB.prepare("UPDATE orders SET status = ?, printify_order_id = ?, updated_at = ? WHERE id = ?").bind("FULFILLMENT_SUBMITTED", printify.id, Date.now(), orderId).run();
  } catch (error) {
    await runtime.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").bind("FULFILLMENT_ERROR", Date.now(), orderId).run();
    console.error("Printify fulfillment failed", error);
    return Response.json({ error:"Printify order creation failed" }, { status:502 });
  }
  return Response.json({ received:true });
}
