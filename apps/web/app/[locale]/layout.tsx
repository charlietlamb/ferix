import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@ferix/ui/styles/globals.css';
import { routing } from '@ferix/i18n/routing';
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
