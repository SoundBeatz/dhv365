import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./platform.css";
import "./navigation.css";
import "./recovery.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dhv365.nl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "DHV365 | Dedicated High Value & Critical Transport", template: "%s | DHV365" },
  description: "Dedicated vervoer van vertrouwelijke, waardevolle en tijdkritische zendingen. Eén chauffeur, één voertuig, geen overslag en volledige chain-of-custody.",
  applicationName: "DHV365",
  alternates: { canonical: "/", languages: { "nl-NL": "/" } },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "/",
    siteName: "DHV365",
    title: "DHV365 — Dedicated High Value & Critical Transport",
    description: "Rechtstreeks vervoer zonder overslag. Volledig controleerbaar van overdracht tot aflevering.",
  },
  twitter: { card: "summary_large_image", title: "DHV365", description: "One driver. One vehicle. One consignment. No transfer." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  category: "transport",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#07110f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl" className={`${manrope.variable} ${space.variable}`}><body>{children}</body></html>;
}
