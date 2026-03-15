import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/client-providers";

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
    <html lang="ko" className="dark">
      <body className="min-h-screen max-w-[480px] mx-auto">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
