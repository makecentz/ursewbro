import Link from "next/link";
import AccountClient from "./AccountClient";

export default function AccountPage() {
  return <main className="dashboard-page"><Link href="/" className="dashboard-back">← VIVLOX STOREFRONT</Link><AccountClient /></main>;
}
