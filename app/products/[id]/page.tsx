import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../../components/SiteChrome";
import ProductActions from "../../../components/ProductActions";
import { getStoreProduct, getStoreProducts } from "../../../lib/printify";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getStoreProduct(id);
  if (!product) return { title:"Product not found | Vivlox" };
  return {
    title:`${product.name} | Vivlox`,
    description:product.description,
    openGraph:{ title:`${product.name} | Vivlox`, description:product.description, images:product.image ? [product.image] : [] },
    twitter:{ card:product.image ? "summary_large_image" : "summary", title:`${product.name} | Vivlox`, description:product.description, images:product.image ? [product.image] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, products] = await Promise.all([getStoreProduct(id), getStoreProducts()]);
  if (!product) notFound();
  const upsells = products.filter((item) => item.id !== product.id).slice(0, 3);
  return <main><SiteHeader /><section className="product-page"><div className={`product-gallery ${product.tone}`}>{product.image ? <Image src={product.image} alt={product.name} fill sizes="(max-width: 900px) 100vw, 55vw" unoptimized /> : <span>{product.art}</span>}</div><div className="product-detail"><p className="kicker acid">{product.category}</p><h1>{product.name}</h1><strong>${product.price.toFixed(2)}</strong><p>{product.description}</p><ProductActions product={product} /><ul><li>Made and fulfilled through Printify</li><li>Tracking provided after shipment</li><li>Secure checkout</li></ul></div></section><section className="upsells section paper"><div className="section-head"><div><p className="kicker">COMPLETE THE LOOK</p><h2>YOU MAY ALSO LIKE</h2></div></div><div className="product-grid">{upsells.map((item)=><article className={`product-card ${item.tone}`} key={item.id}><a className="product-art" href={`/products/${item.id}`}>{item.image ? <Image src={item.image} alt={item.name} fill sizes="30vw" unoptimized /> : <span>{item.art}</span>}</a><div className="product-meta"><div><p>{item.category}</p><h3>{item.name}</h3></div><strong>${item.price}</strong></div><a className="upsell-link" href={`/products/${item.id}`}>VIEW PRODUCT →</a></article>)}</div></section><SiteFooter /></main>;
}
