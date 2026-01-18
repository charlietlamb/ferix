import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { Suspense } from "react";
import "@ferix/ui/styles/globals.css";
import { Providers } from "./providers";
import { VerifiedToast } from "./verified-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ferix.ai";

export const metadata: Metadata = {
  title: {
    default: "Ferix - AI Agent Skills & Prompts",
    template: "%s | Ferix",
  },
  description:
    "Discover and share skills, subagents, and rules for AI agents like Claude, Cursor, and more.",
  openGraph: {
    type: "website",
    siteName: "Ferix",
    locale: "en_US",
    images: [
      {
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: "Ferix - AI Agent Skills & Prompts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${siteUrl}/api/og`],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers locale={locale} messages={messages}>
          <Suspense>
            <VerifiedToast />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
