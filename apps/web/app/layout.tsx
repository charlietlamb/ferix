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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ferix - AI Agent Skills & Prompts",
    template: "%s | Ferix",
  },
  description:
    "Discover and share skills, subagents, and rules for AI agents like Claude, Cursor, and more.",
  keywords: [
    "AI agent prompts",
    "Claude skills",
    "Cursor rules",
    "AI assistant configuration",
    "prompt engineering",
    "AI coding agents",
    "Claude Code",
    "MCP skills",
    "AI workflows",
  ],
  category: "technology",
  openGraph: {
    type: "website",
    siteName: "Ferix",
    locale: "en_US",
    url: siteUrl,
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Ferix - AI Agent Skills & Prompts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og"],
  },
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ferix",
  url: siteUrl,
  description:
    "Discover and share skills, subagents, and rules for AI agents like Claude, Cursor, and more.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ferix",
  url: siteUrl,
  logo: `${siteUrl}/api/og`,
  description:
    "Ferix is a platform for discovering and sharing AI agent skills, prompts, and configurations.",
  sameAs: ["https://github.com/charlietlamb/ferix"],
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
      <head>
        <script
          /* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires dangerouslySetInnerHTML, content is static */
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          type="application/ld+json"
        />
        <script
          /* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires dangerouslySetInnerHTML, content is static */
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
          type="application/ld+json"
        />
      </head>
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
