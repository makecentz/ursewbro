"use client";

import { useState } from "react";
import type { StoreProduct } from "../lib/printify";
import { checkoutHeaders } from "../lib/supabase-browser";

export default function ProductActions({ product }: { product: StoreProduct }) {
  const available = product.variants?.filter((variant) => variant.available) || [];
  const [variantId, setVariantId] = useState(String(available[0]?.id || product.sizes[0] || "default"));
  const selected = available.find((variant) => String(variant.id) === variantId);
  const price = selected?.price || product.price;

  async function buyNow() {
    const response = await fetch("/api/checkout", { method: "POST", headers: await checkoutHeaders(), body: JSON.stringify({ items: [{ id: product.id, variantId, name: product.name, price, meta: selected?.title || variantId, qty: 1 }] }) });
    const result = await response.json() as { url?: string; error?: string };
    if (result.url) window.location.href = result.url;
    else alert(result.error || "Checkout is not available yet.");
  }

  return <div className="product-actions"><label>SELECT SIZE / STYLE<select value={variantId} onChange={(event)=>setVariantId(event.target.value)}>{available.length ? available.map((variant)=><option key={variant.id} value={variant.id}>{variant.title} — ${variant.price.toFixed(2)}</option>) : product.sizes.map((size)=><option key={size}>{size}</option>)}</select></label><button className="button dark-button" onClick={buyNow}>BUY NOW — ${price.toFixed(2)}</button><p>Secure checkout • Ready-made item • Fulfilled through Printify</p></div>;
}
