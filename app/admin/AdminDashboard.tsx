"use client";

import { FormEvent, useState } from "react";
import type { StoreOrder } from "../../lib/printify";
import type { SiteContent } from "../../lib/site-content";

export default function AdminDashboard({ orders, productCount, printifyConnected, content, accessToken }: { orders: StoreOrder[]; productCount: number; printifyConnected: boolean; content: SiteContent; accessToken: string }) {
  const [message, setMessage] = useState("");
  const customers = new Set(orders.map((order) => order.customerEmail).filter((email) => email !== "—")).size;
  const sales = orders.reduce((sum, order) => sum + order.total, 0);

  async function saveSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving…");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/sections", { method: "POST", headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" }, body: JSON.stringify(fields) });
    setMessage(response.ok ? "Section saved. Refresh the storefront to see it." : "That section could not be saved.");
  }

  return <><div className="dashboard-head"><p className="kicker acid">OWNER CONTROL ROOM</p><h1>ADMIN / VIVLOX</h1><p className={printifyConnected ? "status-live" : "status-warn"}>{printifyConnected ? "● PRINTIFY CONNECTED" : "○ ADD PRINTIFY CREDENTIALS TO LOAD LIVE DATA"}</p></div><div className="admin-grid metrics-grid"><article><span>${sales.toFixed(0)}</span><h2>SALES</h2><p>Across the latest Printify orders.</p></article><article><span>{orders.length}</span><h2>ORDERS</h2><p>Recent fulfillment activity.</p></article><article><span>{customers}</span><h2>CUSTOMERS</h2><p>Unique customer emails.</p></article><article><span>{productCount}</span><h2>PRODUCTS</h2><p>Managed from your Printify account.</p></article></div><section className="admin-section"><div className="section-head inverse"><div><p className="kicker acid">LIVE STOREFRONT COPY</p><h2>EDIT SITE SECTIONS</h2></div></div><p className="admin-note">Update the main storefront messaging here. Product names, prices, images, and variants continue to come from Printify.</p><div className="section-editor-grid">{Object.entries(content).map(([key, value])=><form onSubmit={saveSection} className="section-editor" key={key}><input type="hidden" name="sectionKey" value={key} /><h3>{key}</h3><label>EYEBROW<input name="subtitle" defaultValue={value.subtitle} required /></label><label>HEADLINE<input name="title" defaultValue={value.title} required /></label><label>BODY<textarea name="body" defaultValue={value.body} rows={4} required /></label><button type="submit">SAVE SECTION →</button></form>)}</div><p className="form-status" aria-live="polite">{message}</p></section><section className="admin-section"><div className="section-head inverse"><div><p className="kicker acid">LATEST ACTIVITY</p><h2>ORDERS & CUSTOMERS</h2></div></div>{orders.length ? <div className="order-table"><div className="order-row order-header"><b>ORDER</b><b>CUSTOMER</b><b>STATUS</b><b>TOTAL</b></div>{orders.slice(0,20).map((order)=><div className="order-row" key={order.id}><span>{order.id.slice(-8).toUpperCase()}</span><span>{order.customerName}<small>{order.customerEmail}</small></span><span>{order.status}</span><strong>${order.total.toFixed(2)}</strong></div>)}</div> : <div className="empty-order compact-empty"><h2>NO PRINTIFY ORDERS YET.</h2><p>Orders and customer details will appear here when Printify is connected and sales begin.</p></div>}</section></>;
}
