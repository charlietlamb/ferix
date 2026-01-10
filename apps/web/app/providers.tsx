"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@ferix/auth/client";
import { env } from "@ferix/env/nextjs";
import { ConvexReactClient } from "convex/react";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface ProvidersProps {
  children: ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ConvexBetterAuthProvider authClient={authClient} client={convex}>
          {children}
        </ConvexBetterAuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
