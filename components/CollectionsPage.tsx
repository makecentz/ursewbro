"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { products as fallbackProducts } from "../data/catalog";
import type { StoreProduct } from "../lib/printify";
import { SiteFooter, SiteHeader } from "./SiteChrome";

export default function CollectionsPage({ initialProducts }: { initialProducts?: StoreProduct[] }) {
  const [products, setProducts] = useState<StoreProduct[]>(
    initialProducts?.length
      ? initialProducts
      : fallbackProducts.map((product) => ({ ...product, source: "demo" as const })),
  );
  const [category, setCategory] = useState("");

  useEffect(() => {
    setCategory(new URLSearchParams(window.location.search).get("category")?.toLowerCase() || "");
  }, []);

  useEffect(() => {
    if (initialProducts?.length) return;
    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) throw new Error("Product feed unavailable");
        return response.json() as Promise<{ products?: StoreProduct[] }>;
      })
      .then((result) => {
        if (result.products?.length) setProducts(result.products);
      })
      .catch(() => undefined);
  }, [initialProducts]);

  const visibleProducts = useMemo(() => category
    ? products.filter((product) => `${product.category} ${product.name}`.toLowerCase().includes(category))
    : products, [category, products]);

  return (
    <main>
      <SiteHeader onLight />
      <section className="collections-page paper">
        <div className="collections-heading">
          <p className="kicker">SHOP VIVLOX</p>
          <h1>{category ? category.toUpperCase() : "COLLECTIONS"}</h1>
          <p>{category ? `Shop ready-to-wear Vivlox ${category}.` : "Explore every ready-to-wear Vivlox release in one place."}</p>
        </div>
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <article className={`product-card ${product.tone}`} key={product.id}>
              <button className="heart" aria-label={`Save ${product.name}`}>♡</button>
              {product.badge && <span className="badge">{product.badge}</span>}
              <a className="product-art" href={`/products/${product.id}`} aria-label={`View ${product.name}`}>
                {product.image ? <Image src={product.image} alt={product.name} fill sizes="(max-width: 900px) 50vw, 25vw" unoptimized /> : <span>{product.art}</span>}
              </a>
              <div className="product-meta">
                <div><p>{product.category}</p><h3><a href={`/products/${product.id}`}>{product.name}</a></h3></div>
                <strong>${product.price.toFixed(2)}</strong>
              </div>
              <div className="product-quick"><a href={`/products/${product.id}`}>VIEW PRODUCT</a></div>
            </article>
          ))}
        </div>
        {!visibleProducts.length && <p className="collections-empty">No pieces are currently available in this collection.</p>}
      </section>
      <SiteFooter />
    </main>
  );
}
