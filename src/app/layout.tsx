import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VendorProof — Exa vendor diligence for financial services",
  description:
    "VendorProof uses Exa's live web search to verify vendor claims, compare competitors, surface risk flags, and produce a procurement-ready negotiation brief — every insight cited to a real source.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
