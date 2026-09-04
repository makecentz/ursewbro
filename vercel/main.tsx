import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Storefront from "../app/Storefront";
import AdminGate from "../app/admin/AdminGate";
import CollectionsPage from "../components/CollectionsPage";
import ProductPageClient from "../components/ProductPageClient";
import AccountClient from "../app/account/AccountClient";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Vivlox root element was not found.");
}

const path = window.location.pathname.replace(/\/$/, "") || "/";
const productMatch = path.match(/^\/products\/([^/]+)$/);
const page = path === "/collections"
  ? <CollectionsPage />
  : path === "/admin"
    ? <main className="dashboard-page"><a href="/" className="dashboard-back">← STOREFRONT</a><AdminGate /></main>
    : path === "/account"
      ? <main><SiteHeader /><section className="dashboard-page"><a href="/" className="dashboard-back">← STOREFRONT</a><AccountClient /></section><SiteFooter /></main>
    : productMatch
      ? <ProductPageClient productId={decodeURIComponent(productMatch[1])} />
    : <Storefront />;

createRoot(root).render(<StrictMode>{page}</StrictMode>);
