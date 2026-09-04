import { env } from "cloudflare:workers";
import { products as fallbackProducts, type Product } from "../data/catalog";

type PrintifyEnv = { PRINTIFY_API_TOKEN?: string; PRINTIFY_SHOP_ID?: string };
type PrintifyImage = { src?: string; is_default?: boolean; position?: string };
type PrintifyVariant = { id: number; title?: string; price?: number; is_enabled?: boolean; is_available?: boolean; options?: number[] };
type PrintifyProduct = { id: string; title: string; description?: string; tags?: string[]; images?: PrintifyImage[]; variants?: PrintifyVariant[] };
type PrintifyPage<T> = { data?: T[] };
type PrintifyOrder = {
  id: string;
  status?: string;
  total_price?: number;
  created_at?: string;
  address_to?: { first_name?: string; last_name?: string; email?: string };
};

export type FulfillmentItem = { productId: string; variantId: number; quantity: number };
export type ShippingAddress = { firstName: string; lastName: string; email: string; phone?: string; country: string; region?: string; address1: string; address2?: string; city: string; zip: string };

export type StoreVariant = { id: number | string; title: string; price: number; available: boolean };
export type StoreProduct = Product & { image?: string; images?: string[]; variants?: StoreVariant[]; source: "printify" | "demo" };
export type StoreOrder = { id: string; status: string; total: number; createdAt: string; customerName: string; customerEmail: string };

const baseUrl = "https://api.printify.com/v1";

function config() {
  const runtime = env as unknown as PrintifyEnv;
  return { token: runtime.PRINTIFY_API_TOKEN, shopId: runtime.PRINTIFY_SHOP_ID };
}

async function printifyFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const { token } = config();
  if (!token) return null;
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json;charset=utf-8", "User-Agent":"Vivlox Website", ...init.headers } });
  if (!response.ok) throw new Error(`Printify request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

function textOnly(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function readyMadeCopy(value = "") {
  return value
    .replace(/one[- ]of[- ]a[- ]kind/gi, "limited edition")
    .replace(/one[- ]of[- ]one(s)?/gi, (_, plural) => plural ? "limited releases" : "limited release")
    .replace(/1\s*(?:of|[-/])\s*1/gi, "limited")
    .replace(/custom[- ]made|custom work/gi, "ready-made");
}

function normalize(product: PrintifyProduct): StoreProduct {
  const variants = (product.variants || []).filter((variant) => variant.is_enabled !== false).map((variant) => ({
    id: variant.id,
    title: variant.title || `Variant ${variant.id}`,
    price: (variant.price || 0) / 100,
    available: variant.is_available !== false,
  }));
  const images = (product.images || []).map((image) => image.src).filter((src): src is string => Boolean(src));
  const minimumPrice = variants.filter((variant) => variant.available).reduce((lowest, variant) => lowest === 0 ? variant.price : Math.min(lowest, variant.price), 0);
  return {
    id: product.id,
    name: readyMadeCopy(product.title),
    category: readyMadeCopy(product.tags?.[0] || "Ready to wear"),
    price: minimumPrice,
    badge: "FEATURED",
    tone: "black",
    art: "V",
    sizes: variants.filter((variant) => variant.available).map((variant) => variant.title),
    description: readyMadeCopy(textOnly(product.description)) || "A ready-to-wear Vivlox release.",
    image: images[0],
    images,
    variants,
    source: "printify",
  };
}

function demoProducts(): StoreProduct[] {
  return fallbackProducts.map((product) => ({ ...product, source: "demo" as const }));
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
  const { shopId } = config();
  if (!shopId) return demoProducts();
  try {
    const response = await printifyFetch<PrintifyPage<PrintifyProduct>>(`/shops/${shopId}/products.json?limit=50`);
    const products = (response?.data || []).map(normalize);
    return products.length ? products : demoProducts();
  } catch (error) {
    console.error("Printify products unavailable", error);
    return demoProducts();
  }
}

export async function getStoreProduct(id: string): Promise<StoreProduct | null> {
  const { shopId } = config();
  if (shopId) {
    try {
      const product = await printifyFetch<PrintifyProduct>(`/shops/${shopId}/products/${encodeURIComponent(id)}.json`);
      if (product) return normalize(product);
    } catch (error) {
      console.error("Printify product unavailable", error);
    }
  }
  return demoProducts().find((product) => product.id === id) || null;
}

export async function getPrintifyOrders(): Promise<StoreOrder[]> {
  const { shopId } = config();
  if (!shopId) return [];
  try {
    const response = await printifyFetch<PrintifyPage<PrintifyOrder>>(`/shops/${shopId}/orders.json?limit=50`);
    return (response?.data || []).map((order) => ({
      id: order.id,
      status: order.status || "unknown",
      total: (order.total_price || 0) / 100,
      createdAt: order.created_at || "",
      customerName: [order.address_to?.first_name, order.address_to?.last_name].filter(Boolean).join(" ") || "Customer",
      customerEmail: order.address_to?.email || "—",
    }));
  } catch (error) {
    console.error("Printify orders unavailable", error);
    return [];
  }
}

export async function createPrintifyOrder(externalId: string, items: FulfillmentItem[], address: ShippingAddress) {
  const { shopId } = config();
  if (!shopId) throw new Error("Printify shop is not configured");
  return printifyFetch<PrintifyOrder>(`/shops/${shopId}/orders.json`, {
    method: "POST",
    body: JSON.stringify({
      external_id: externalId,
      line_items: items.map((item, index) => ({ product_id:item.productId, variant_id:item.variantId, quantity:item.quantity, external_id:`${externalId}-${index + 1}` })),
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: { first_name:address.firstName, last_name:address.lastName, email:address.email, phone:address.phone || "", country:address.country, region:address.region || "", address1:address.address1, address2:address.address2 || "", city:address.city, zip:address.zip },
    }),
  });
}

export function isPrintifyConfigured() {
  const { token, shopId } = config();
  return Boolean(token && shopId);
}
