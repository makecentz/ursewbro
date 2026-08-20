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
  const title = "UrSewBro | Custom Denim & One-of-One Streetwear";
  const description = "Shop custom denim, upcycled clothing and one-of-one streetwear from UrSewBro. Send in your jeans or commission something completely custom.";
  return {
    metadataBase: new URL(origin), title, description, applicationName: "UrSewBro",
    icons: { icon: "/brand/ursewbro-logo.png", shortcut: "/brand/ursewbro-logo.png", apple: "/brand/ursewbro-logo.png" },
    openGraph: { title, description, type: "website", siteName: "UrSewBro", url: origin, images: [{ url: `${origin}/og.png`, width: 1536, height: 864, alt: "UrSewBro — You wear clothes. We make pieces." }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
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
