type PrintifyImage = { src?: string; is_default?: boolean };
type PrintifyVariant = { id: number; title?: string; price?: number; is_enabled?: boolean; is_available?: boolean };
type PrintifyProduct = { id: string; title: string; description?: string; tags?: string[]; images?: PrintifyImage[]; variants?: PrintifyVariant[] };

function text(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

export default async function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) return response.status(503).json({ error: "Printify is not configured." });

  try {
    const result = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=50`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "Vivlox Website" },
    });
    if (!result.ok) return response.status(502).json({ error: "Printify products are unavailable." });
    const payload = await result.json() as { data?: PrintifyProduct[] };
    const products = (payload.data || []).map((product, index) => {
      const variants = (product.variants || []).filter((variant) => variant.is_enabled !== false).map((variant) => ({
        id: variant.id,
        title: variant.title || "Standard",
        price: Number(variant.price || 0) / 100,
        available: variant.is_available !== false,
      }));
      const available = variants.filter((variant) => variant.available);
      const image = product.images?.find((entry) => entry.is_default)?.src || product.images?.[0]?.src;
      return {
        id: product.id,
        name: product.title,
        category: product.tags?.[0] || "Vivlox",
        description: text(product.description) || "Ready-to-wear clothing from Vivlox.",
        price: Math.min(...(available.length ? available : variants).map((variant) => variant.price).filter((price) => price > 0)),
        badge: "FEATURED",
        tone: ["black", "blue", "cream", "green"][index % 4],
        art: "V",
        image,
        sizes: variants.map((variant) => variant.title),
        variants,
        source: "printify",
      };
    }).filter((product) => Number.isFinite(product.price));
    return response.status(200).json({ products });
  } catch (error) {
    console.error("Printify product request failed", error);
    return response.status(502).json({ error: "Printify products are unavailable." });
  }
}
