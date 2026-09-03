import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function TrackPage() {
  const user = await requireChatGPTUser("/track");
  return <main className="dashboard-page"><Link href="/" className="dashboard-back">← VIVLOX</Link><div className="dashboard-head"><p className="kicker acid">SHOPPER DASHBOARD</p><h1>YOUR PIECES.</h1><p>Signed in as {user.email}</p></div><div className="dashboard-tabs"><b>SHOP ORDERS</b><span>WISHLIST</span></div><section className="empty-order"><span className="stitch-icon">✂</span><h2>NO ORDERS YET.</h2><p>When you place an order, every stage—from confirmed to shipped—will show up here.</p><Link className="button button-light" href="/#drops">SHOP THE DROP</Link></section></main>;
}
