import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@ferix/ui/styles/globals.css';
import { routing } from '@ferix/i18n/routing';
import { TailwindIndicator } from '@ferix/ui/components/utility/development/tailwind-indicator';
import { Providers } from '@ferix/ui/providers';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ferix',
  description: 'Ferix',
};

const renderReactScan = true;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {renderReactScan && (
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen max-w-screen font-geist-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <TailwindIndicator />
      </body>
    </html>
  );
}
