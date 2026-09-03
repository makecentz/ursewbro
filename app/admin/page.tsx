import Link from "next/link";
import { env } from "cloudflare:workers";
import { requireChatGPTUser } from "../chatgpt-auth";
import { getPrintifyOrders, getStoreProducts, isPrintifyConfigured } from "../../lib/printify";
import { getSiteContent } from "../../lib/site-content";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const allowed = (env as unknown as { ADMIN_EMAIL?: string }).ADMIN_EMAIL;
  if (!allowed || user.email.toLowerCase() !== allowed.toLowerCase()) return <main className="dashboard-page"><Link href="/" className="dashboard-back">← VIVLOX</Link><section className="empty-order"><h1>ADMIN ACCESS REQUIRED.</h1><p>The owner email must be configured before this dashboard opens.</p></section></main>;
  const [orders, products, content] = await Promise.all([getPrintifyOrders(), getStoreProducts(), getSiteContent()]);
  return <main className="dashboard-page"><Link href="/" className="dashboard-back">← STOREFRONT</Link><AdminDashboard orders={orders} productCount={products.length} printifyConnected={isPrintifyConfigured()} content={content} /></main>;
}
