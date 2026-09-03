import Link from "next/link";
import AdminGate from "./AdminGate";

export default function AdminPage() {
  return <main className="dashboard-page"><Link href="/" className="dashboard-back">← STOREFRONT</Link><AdminGate /></main>;
}
