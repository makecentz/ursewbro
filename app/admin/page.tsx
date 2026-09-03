import Link from "next/link";
import { env } from "cloudflare:workers";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const allowed = (env as unknown as { ADMIN_EMAIL?: string }).ADMIN_EMAIL;
  if (!allowed || user.email.toLowerCase() !== allowed.toLowerCase()) return <main className="dashboard-page"><Link href="/" className="dashboard-back">← VIVLOX</Link><section className="empty-order"><h1>ADMIN ACCESS REQUIRED.</h1><p>The owner email must be configured before this dashboard opens.</p></section></main>;
  const cards = [["ORDERS","0","View orders and update fulfillment"],["PRODUCTS","4","Edit pricing, stock, and one-of-ones"],["PAYMENTS","0","Orders, refunds, and payouts"],["CONTENT","18","Announcements, FAQ, and lookbook"],["SEWIT KNOWLEDGE","6","Keep answers current"]];
  return <main className="dashboard-page"><Link href="/" className="dashboard-back">← STOREFRONT</Link><div className="dashboard-head"><p className="kicker acid">OWNER CONTROL ROOM</p><h1>ADMIN / VIVLOX</h1><p>{user.email}</p></div><div className="admin-grid">{cards.map(([title,count,copy])=><article key={title}><span>{count}</span><h2>{title}</h2><p>{copy}</p><button>OPEN →</button></article>)}</div></main>;
}
