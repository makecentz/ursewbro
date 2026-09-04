import { createPrintifyOrder, serverConfig, supabaseAdmin, type CheckoutLine, validStripeSignature } from "../../server/commerce.js";

type ApiRequest = AsyncIterable<Uint8Array> & { method?: string; headers: { "stripe-signature"?: string } };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };
type StripeAddress = { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string };
type StripeSession = { id: string; client_reference_id?: string; payment_status?: string; payment_intent?: string; amount_total?: number; customer_details?: { email?: string; name?: string; phone?: string; address?: StripeAddress }; shipping_details?: { name?: string; address?: StripeAddress }; collected_information?: { shipping_details?: { name?: string; address?: StripeAddress } } };
type StripeEvent = { id: string; type: string; data: { object: StripeSession } };

export const config = { api: { bodyParser: false } };

async function rawBody(request: ApiRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function shippingAddress(session: StripeSession) {
  const shipping = session.collected_information?.shipping_details || session.shipping_details;
  const address = shipping?.address || session.customer_details?.address;
  const name = shipping?.name || session.customer_details?.name || "";
  const email = session.customer_details?.email || "";
  if (!address?.line1 || !address.city || !address.postal_code || !address.country || !email) return null;
  const names = name.trim().split(/\s+/);
  return { firstName: names.shift() || "Customer", lastName: names.join(" ") || "Customer", email, phone: session.customer_details?.phone, country: address.country, region: address.state, address1: address.line1, address2: address.line2, city: address.city, zip: address.postal_code };
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const { stripeWebhookSecret } = serverConfig();
  const supabase = supabaseAdmin();
  if (!stripeWebhookSecret || !supabase) return response.status(503).json({ error: "Webhook is not configured" });
  const payload = await rawBody(request);
  if (!validStripeSignature(payload, request.headers["stripe-signature"] || "", stripeWebhookSecret)) return response.status(400).json({ error: "Invalid signature" });

  const event = JSON.parse(payload) as StripeEvent;
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return response.status(200).json({ received: true });
  const session = event.data.object;
  if (session.payment_status !== "paid" || !session.client_reference_id) return response.status(200).json({ received: true });

  const { data: processed } = await supabase.from("webhook_events").select("event_id").eq("event_id", event.id).maybeSingle();
  if (processed) return response.status(200).json({ received: true, duplicate: true });
  const { data: order } = await supabase.from("orders").select("id,total_cents,printify_order_id,order_items(printify_product_id,printify_variant_id,product_name,variant_name,image_url,quantity,unit_price_cents)").eq("id", session.client_reference_id).eq("stripe_checkout_session_id", session.id).maybeSingle();
  if (!order) return response.status(404).json({ error: "Order not found" });
  if (order.printify_order_id) return response.status(200).json({ received: true, duplicate: true });
  if (Number(session.amount_total) !== Number(order.total_cents)) return response.status(409).json({ error: "Payment total does not match the order" });
  const address = shippingAddress(session);
  if (!address) return response.status(422).json({ error: "Missing fulfillment details" });

  const items = (order.order_items || []).map((item: { printify_product_id: string; printify_variant_id: string; product_name: string; variant_name?: string; image_url?: string; quantity: number; unit_price_cents: number }) => ({
    productId: item.printify_product_id,
    variantId: Number(item.printify_variant_id),
    name: item.product_name,
    variantName: item.variant_name || "Standard",
    imageUrl: item.image_url,
    quantity: item.quantity,
    unitAmount: Number(item.unit_price_cents),
  })) satisfies CheckoutLine[];
  const timestamp = new Date().toISOString();
  await supabase.from("orders").update({ customer_email: address.email.toLowerCase(), customer_name: `${address.firstName} ${address.lastName}`, status: "paid", stripe_payment_intent_id: session.payment_intent || null, shipping_address: address, placed_at: timestamp, updated_at: timestamp }).eq("id", order.id);

  try {
    const printify = await createPrintifyOrder(order.id, items, address);
    if (!printify.id) throw new Error("Printify did not return an order id");
    await supabase.from("orders").update({ status: "submitted", printify_order_id: printify.id, updated_at: new Date().toISOString() }).eq("id", order.id);
    await supabase.from("webhook_events").insert({ event_id: event.id, provider: "stripe", event_type: event.type, processed_at: new Date().toISOString() });
    return response.status(200).json({ received: true });
  } catch (error) {
    console.error("Printify fulfillment failed", error);
    await supabase.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return response.status(502).json({ error: "Printify order creation failed" });
  }
}
