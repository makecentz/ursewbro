import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Storefront from "../app/Storefront";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Vivlox root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <Storefront />
  </StrictMode>,
);
