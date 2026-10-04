import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/data";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

const url = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: "ROVEYA | Premium Travel & Reliable Journeys",
    template: "%s | ROVEYA",
  },
  description:
    "ROVEYA is a premium transportation company offering comfortable, reliable journeys and simple in-vehicle digital payments.",
  openGraph: {
    title: "ROVEYA | Premium Travel & Reliable Journeys",
    description:
      "Comfortable, reliable and transparent travel with simple ride payments from your seat.",
    url,
    siteName: "ROVEYA",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/images/hero.jpg", width: 1200, height: 675, alt: "ROVEYA premium travel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ROVEYA | Premium Travel & Reliable Journeys",
    description: "Comfortable, reliable and transparent travel with simple in-vehicle payments.",
    images: ["/images/hero.jpg"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${cormorant.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
