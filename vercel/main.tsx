import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Storefront from "../app/Storefront";
import AdminGate from "../app/admin/AdminGate";
import CollectionsPage from "../components/CollectionsPage";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Vivlox root element was not found.");
}

const path = window.location.pathname.replace(/\/$/, "") || "/";
const page = path === "/collections"
  ? <CollectionsPage />
  : path === "/admin"
    ? <main className="dashboard-page"><a href="/" className="dashboard-back">← STOREFRONT</a><AdminGate /></main>
    : <Storefront />;

createRoot(root).render(<StrictMode>{page}</StrictMode>);
