import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "ursewbro.com";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Vivlox | Limited-Run Streetwear";
  const description = "Shop ready-to-wear denim, upcycled clothing, and limited streetwear drops from Vivlox.";
  return {
    metadataBase: new URL(origin), title, description, applicationName: "Vivlox",
    icons: { icon: "/brand/hero-v-logo.png", shortcut: "/brand/hero-v-logo.png", apple: "/brand/hero-v-logo.png" },
    openGraph: { title, description, type: "website", siteName: "Vivlox", url: origin },
    twitter: { card: "summary", title, description },
    other: { "theme-color": "#050505" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
