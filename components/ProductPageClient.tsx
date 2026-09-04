"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { StoreProduct } from "../lib/printify";
import ProductActions from "./ProductActions";
import { SiteFooter, SiteHeader } from "./SiteChrome";

export default function ProductPageClient({ productId }: { productId: string }) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) throw new Error("Product feed unavailable");
        return response.json() as Promise<{ products?: StoreProduct[] }>;
      })
      .then((result) => setProducts(result.products || []))
      .catch(() => setError("This product could not be loaded right now."));
  }, []);

  const product = useMemo(() => products.find((item) => item.id === productId), [productId, products]);
  const upsells = useMemo(() => products.filter((item) => item.id !== productId).slice(0, 3), [productId, products]);

  if (error) return <main><SiteHeader onLight /><section className="product-loading"><h1>PRODUCT UNAVAILABLE.</h1><p>{error}</p><a className="button dark-button" href="/collections">BACK TO COLLECTIONS</a></section><SiteFooter /></main>;
  if (!product) return <main><SiteHeader onLight /><section className="product-loading"><p className="kicker">VIVLOX</p><h1>LOADING PRODUCT…</h1></section></main>;

  return <main><SiteHeader onLight /><section className="product-page"><div className={`product-gallery ${product.tone}`}>{product.image ? <Image src={product.image} alt={product.name} fill sizes="(max-width: 900px) 100vw, 55vw" unoptimized /> : <span>{product.art}</span>}</div><div className="product-detail"><p className="kicker acid">{product.category}</p><h1>{product.name}</h1><strong>${product.price.toFixed(2)}</strong><p>{product.description}</p><ProductActions product={product} /><ul><li>Made and fulfilled through Printify</li><li>Tracking provided after shipment</li><li>Secure checkout</li></ul></div></section><section className="upsells section paper"><div className="section-head"><div><p className="kicker">COMPLETE THE LOOK</p><h2>YOU MAY ALSO LIKE</h2></div></div><div className="product-grid">{upsells.map((item)=><article className={`product-card ${item.tone}`} key={item.id}><a className="product-art" href={`/products/${item.id}`}>{item.image ? <Image src={item.image} alt={item.name} fill sizes="30vw" unoptimized /> : <span>{item.art}</span>}</a><div className="product-meta"><div><p>{item.category}</p><h3>{item.name}</h3></div><strong>${item.price.toFixed(2)}</strong></div><a className="upsell-link" href={`/products/${item.id}`}>VIEW PRODUCT →</a></article>)}</div></section><SiteFooter /></main>;
}
