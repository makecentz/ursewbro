"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";
import type { StoreOrder } from "../../lib/printify";
import type { SiteContent } from "../../lib/site-content";
import AdminDashboard from "./AdminDashboard";

type DashboardData = { orders: StoreOrder[]; productCount: number; printifyConnected: boolean; content: SiteContent };

export default function AdminGate() {
  const client = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    client.auth.getSession().then(({ data: auth }) => { setSession(auth.session); setLoading(false); });
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!session) { setData(null); return; }
    fetch("/api/admin/dashboard", { headers: { authorization: `Bearer ${session.access_token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 ? "This email is not authorized for the owner dashboard." : "The dashboard could not load.");
        setData(await response.json() as DashboardData);
      })
      .catch((error: Error) => setMessage(error.message));
  }, [session]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const email = new FormData(event.currentTarget).get("email")?.toString().trim();
    if (!email) return;
    setMessage("Sending your secure admin sign-in link…");
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setMessage(error ? error.message : "Check your email for the Vivlox admin sign-in link.");
  }

  if (loading) return <section className="empty-order"><p>Loading admin access…</p></section>;
  if (!session || !data) return <section className="account-signin"><p className="kicker acid">OWNER ACCESS</p><h2>ADMIN SIGN IN.</h2><p>Use the configured owner email. We’ll send a secure passwordless sign-in link.</p>{!session && <form onSubmit={signIn}><label htmlFor="admin-email">OWNER EMAIL</label><input id="admin-email" name="email" type="email" required autoComplete="email" /><button className="button button-light">EMAIL ADMIN SIGN-IN LINK</button></form>}<p className="form-status" aria-live="polite">{message || (session ? "Verifying owner access…" : "")}</p>{session && <button className="account-signout" onClick={() => client?.auth.signOut()}>SIGN OUT</button>}</section>;
  return <AdminDashboard {...data} accessToken={session.access_token} />;
}
