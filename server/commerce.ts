import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export type CheckoutLine = {
  productId: string;
  variantId: number;
  name: string;
  variantName: string;
  imageUrl?: string;
  unitAmount: number;
  quantity: number;
};

type PrintifyImage = { src?: string; is_default?: boolean };
type PrintifyVariant = { id: number; title?: string; price?: number; is_enabled?: boolean; is_available?: boolean };
type PrintifyProduct = { id: string; title: string; images?: PrintifyImage[]; variants?: PrintifyVariant[] };

export function serverConfig() {
  return {
    printifyToken: process.env.PRINTIFY_API_TOKEN,
    printifyShopId: process.env.PRINTIFY_SHOP_ID,
    stripeKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseSecret: process.env.SUPABASE_SECRET_KEY,
  };
}

export function supabaseAdmin() {
  const { supabaseUrl, supabaseSecret } = serverConfig();
  if (!supabaseUrl || !supabaseSecret) return null;
  return createClient(supabaseUrl, supabaseSecret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticatedUser(authorization?: string) {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const supabase = supabaseAdmin();
  if (!token || !supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

async function printifyFetch<T>(path: string, init: RequestInit = {}) {
  const { printifyToken } = serverConfig();
  if (!printifyToken) throw new Error("Printify is not configured");
  const response = await fetch(`https://api.printify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${printifyToken}`, "Content-Type": "application/json;charset=utf-8", "User-Agent": "Vivlox Website", ...init.headers },
  });
  if (!response.ok) throw new Error(`Printify request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export async function validateCheckoutItems(items: Array<{ id?: string; variantId?: string | number; qty?: number }>) {
  const { printifyShopId } = serverConfig();
  if (!printifyShopId) throw new Error("Printify is not configured");
  const requested = items.slice(0, 20);
  if (!requested.length) throw new Error("Your bag is empty.");
  const products = new Map<string, PrintifyProduct>();
  const lines: CheckoutLine[] = [];

  for (const item of requested) {
    if (!item.id) throw new Error("A product is missing from your bag.");
    let product = products.get(item.id);
    if (!product) {
      product = await printifyFetch<PrintifyProduct>(`/shops/${printifyShopId}/products/${encodeURIComponent(item.id)}.json`);
      products.set(item.id, product);
    }
    const variant = product.variants?.find((entry) => String(entry.id) === String(item.variantId) && entry.is_enabled !== false && entry.is_available !== false);
    if (!variant?.price || variant.price <= 0) throw new Error("One of these products or sizes is no longer available. Refresh the page and try again.");
    lines.push({
      productId: product.id,
      variantId: variant.id,
      name: product.title,
      variantName: variant.title || "Standard",
      imageUrl: product.images?.find((image) => image.is_default)?.src || product.images?.[0]?.src,
      unitAmount: variant.price,
      quantity: Math.max(1, Math.min(10, Math.floor(Number(item.qty) || 1))),
    });
  }
  return lines;
}

export async function createPrintifyOrder(externalId: string, items: CheckoutLine[], address: { firstName: string; lastName: string; email: string; phone?: string; country: string; region?: string; address1: string; address2?: string; city: string; zip: string }) {
  const { printifyShopId } = serverConfig();
  if (!printifyShopId) throw new Error("Printify is not configured");
  return printifyFetch<{ id?: string }>(`/shops/${printifyShopId}/orders.json`, {
    method: "POST",
    body: JSON.stringify({
      external_id: externalId,
      line_items: items.map((item, index) => ({ product_id: item.productId, variant_id: item.variantId, quantity: item.quantity, external_id: `${externalId}-${index + 1}` })),
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: { first_name: address.firstName, last_name: address.lastName, email: address.email, phone: address.phone || "", country: address.country, region: address.region || "", address1: address.address1, address2: address.address2 || "", city: address.city, zip: address.zip },
    }),
  });
}

export function validStripeSignature(payload: string, header: string, secret: string) {
  const fields = header.split(",").map((part) => part.split("="));
  const timestamp = fields.find(([key]) => key === "t")?.[1];
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest();
  return signatures.some((signature) => {
    try {
      const received = Buffer.from(signature, "hex");
      return received.length === expected.length && timingSafeEqual(received, expected);
    } catch {
      return false;
    }
  });
}
