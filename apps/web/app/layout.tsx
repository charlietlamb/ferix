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

export const metadata: Metadata = {
  title: "Ferix",
  description: "Ferix",
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
