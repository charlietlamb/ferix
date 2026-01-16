"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { AnalyticsProvider } from "@ferix/analytics/provider";
import { authClient } from "@ferix/auth/client";
import { env } from "@ferix/env/nextjs";
import { ConvexReactClient } from "convex/react";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { DialogProvider } from "./dialog-provider";
import { ToastProvider } from "./toast-provider";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface ProvidersProps {
  children: ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <AnalyticsProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NuqsAdapter>
            <ConvexBetterAuthProvider authClient={authClient} client={convex}>
              <AuthProvider>
                <DialogProvider>{children}</DialogProvider>
              </AuthProvider>
              <ToastProvider />
            </ConvexBetterAuthProvider>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}
