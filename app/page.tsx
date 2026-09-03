import Storefront from "./Storefront";
import { getStoreProducts } from "../lib/printify";
import { getSiteContent } from "../lib/site-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, content] = await Promise.all([getStoreProducts(), getSiteContent()]);
  return <Storefront initialProducts={products} content={content} />;
}
