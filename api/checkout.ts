import { randomUUID } from "node:crypto";
import { authenticatedUser, serverConfig, supabaseAdmin, validateCheckoutItems } from "../server/commerce.js";

type ApiRequest = { method?: string; headers: { authorization?: string; host?: string; "x-forwarded-proto"?: string }; body?: unknown };
type ApiResponse = { status: (code: number) => ApiResponse; json: (body: unknown) => void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const { stripeKey } = serverConfig();
  const supabase = supabaseAdmin();
  if (!stripeKey || !supabase) return response.status(503).json({ error: "Checkout is not fully configured yet." });

  try {
    const body = (typeof request.body === "string" ? JSON.parse(request.body) : request.body || {}) as { items?: Array<{ id?: string; variantId?: string | number; qty?: number }> };
    const lines = await validateCheckoutItems(body.items || []);
    const user = await authenticatedUser(request.headers.authorization);
    const orderId = randomUUID();
    const orderNumber = `VIV-${orderId.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const totalCents = lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);
    const customerEmail = user?.email?.toLowerCase() || `pending+${orderId}@checkout.vivlox.store`;

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      order_number: orderNumber,
      customer_id: user?.id || null,
      customer_email: customerEmail,
      status: "pending",
      subtotal_cents: totalCents,
      total_cents: totalCents,
    });
    if (orderError) throw new Error("The order could not be prepared.");
    const { error: itemsError } = await supabase.from("order_items").insert(lines.map((line) => ({
      order_id: orderId,
      printify_product_id: line.productId,
      printify_variant_id: String(line.variantId),
      product_name: line.name,
      variant_name: line.variantName,
      image_url: line.imageUrl || null,
      quantity: line.quantity,
      unit_price_cents: line.unitAmount,
    })));
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", orderId);
      throw new Error("The order items could not be prepared.");
    }

    const origin = `${request.headers["x-forwarded-proto"] || "https"}://${request.headers.host || "vivlox.store"}`;
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("client_reference_id", orderId);
    params.set("metadata[order_id]", orderId);
    if (user?.id) params.set("metadata[customer_id]", user.id);
    if (user?.email) params.set("customer_email", user.email);
    params.set("customer_creation", "always");
    params.set("success_url", `${origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${origin}/collections?checkout=cancelled`);
    params.set("allow_promotion_codes", "true");
    params.set("billing_address_collection", "required");
    params.set("phone_number_collection[enabled]", "true");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    lines.forEach((line, index) => {
      params.set(`line_items[${index}][price_data][currency]`, "usd");
      params.set(`line_items[${index}][price_data][unit_amount]`, String(line.unitAmount));
      params.set(`line_items[${index}][price_data][product_data][name]`, line.name);
      params.set(`line_items[${index}][price_data][product_data][description]`, line.variantName);
      if (line.imageUrl) params.set(`line_items[${index}][price_data][product_data][images][0]`, line.imageUrl);
      params.set(`line_items[${index}][quantity]`, String(line.quantity));
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params });
    const session = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };
    if (!stripeResponse.ok || !session.id || !session.url) {
      await supabase.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", orderId);
      return response.status(502).json({ error: session.error?.message || "Checkout could not start." });
    }
    await supabase.from("orders").update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() }).eq("id", orderId);
    return response.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Checkout failed", error);
    const message = error instanceof Error ? error.message : "Checkout could not start.";
    const status = /bag|product|size|available/i.test(message) ? 409 : 500;
    return response.status(status).json({ error: message });
  }
}
