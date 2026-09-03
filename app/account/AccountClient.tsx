"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type OrderItem = { id: number; product_name: string; variant_name: string | null; quantity: number };
type CustomerOrder = {
  id: string;
  order_number: string;
  status: string;
  total_cents: number;
  tracking_url: string | null;
  created_at: string;
  order_items: OrderItem[];
};

export default function AccountClient() {
  const client = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!client || !session) {
      setOrders([]);
      return;
    }
    client.from("orders")
      .select("id, order_number, status, total_cents, tracking_url, created_at, order_items(id, product_name, variant_name, quantity)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setMessage("We couldn't load your orders. Please refresh and try again.");
        else setOrders((data || []) as CustomerOrder[]);
      });
  }, [client, session]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const email = new FormData(event.currentTarget).get("email")?.toString().trim();
    if (!email) return;
    setMessage("Sending your secure sign-in link…");
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    setMessage(error ? error.message : "Check your email for your Vivlox sign-in link.");
  }

  if (loading) return <section className="empty-order"><p>Loading your account…</p></section>;
  if (!client) return <section className="empty-order"><h2>ACCOUNT SETUP IN PROGRESS.</h2><p>The customer account connection is not available in this environment yet.</p></section>;

  if (!session) return <section className="account-signin"><p className="kicker acid">PASSWORDLESS ACCESS</p><h2>SIGN IN TO YOUR ACCOUNT.</h2><p>Enter the email you use at checkout. We’ll send a secure sign-in link—no password required.</p><form onSubmit={signIn}><label htmlFor="account-email">EMAIL ADDRESS</label><input id="account-email" name="email" type="email" required autoComplete="email" placeholder="YOU@EXAMPLE.COM" /><button className="button button-light">EMAIL ME A SIGN-IN LINK</button></form><p className="form-status" aria-live="polite">{message}</p></section>;

  return <><div className="dashboard-head"><p className="kicker acid">CUSTOMER ACCOUNT</p><h1>YOUR ORDERS.</h1><p>{session.user.email} · <button className="account-signout" onClick={() => client.auth.signOut()}>SIGN OUT</button></p></div><div className="dashboard-tabs"><b>ORDER HISTORY</b><span>ACCOUNT DETAILS</span></div>{message && <p className="form-status">{message}</p>}{orders.length ? <section className="customer-orders">{orders.map((order) => <article className="customer-order" key={order.id}><div><span>ORDER</span><strong>{order.order_number}</strong></div><div><span>PLACED</span><strong>{new Date(order.created_at).toLocaleDateString()}</strong></div><div><span>STATUS</span><strong>{order.status.replaceAll("_", " ")}</strong></div><div><span>TOTAL</span><strong>${(Number(order.total_cents) / 100).toFixed(2)}</strong></div><ul>{order.order_items.map((item) => <li key={item.id}>{item.quantity}× {item.product_name}{item.variant_name ? ` — ${item.variant_name}` : ""}</li>)}</ul>{order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer">TRACK SHIPMENT →</a>}</article>)}</section> : <section className="empty-order"><span className="stitch-icon">✦</span><h2>NO ORDERS YET.</h2><p>Orders placed with this email will appear here, including fulfillment and tracking updates.</p><Link className="button button-light" href="/#drops">SHOP THE DROP</Link></section>}</>;
}
