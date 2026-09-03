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

export type StoreVariant = { id: number | string; title: string; price: number; available: boolean };
export type StoreProduct = Product & { image?: string; images?: string[]; variants?: StoreVariant[]; source: "printify" | "demo" };
export type StoreOrder = { id: string; status: string; total: number; createdAt: string; customerName: string; customerEmail: string };

const baseUrl = "https://api.printify.com/v1";

function config() {
  const runtime = env as unknown as PrintifyEnv;
  return { token: runtime.PRINTIFY_API_TOKEN, shopId: runtime.PRINTIFY_SHOP_ID };
}

async function printifyFetch<T>(path: string): Promise<T | null> {
  const { token } = config();
  if (!token) return null;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json;charset=utf-8" },
  });
  if (!response.ok) throw new Error(`Printify request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

function textOnly(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
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
    name: product.title,
    category: product.tags?.[0] || "Ready to wear",
    price: minimumPrice,
    badge: "PRINTIFY",
    tone: "black",
    art: "V",
    sizes: variants.filter((variant) => variant.available).map((variant) => variant.title),
    description: textOnly(product.description) || "A ready-to-wear Vivlox release.",
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

export function isPrintifyConfigured() {
  const { token, shopId } = config();
  return Boolean(token && shopId);
}
