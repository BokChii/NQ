import type { Metadata } from "next";
import { Noto_Sans_KR, Outfit } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/client-providers";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NQ - News Quotient",
  description: "Gamified News Platform. Prove your news literacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${outfit.variable}`}>
      <body className="min-h-screen max-w-[480px] mx-auto bg-app font-sans text-foreground transition-colors duration-200">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
