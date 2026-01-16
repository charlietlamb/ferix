"use client";

import { PostHogProvider } from "@posthog/react";
import posthog from "posthog-js";
import { type ReactNode, useEffect } from "react";

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) {
      return;
    }

    posthog.init(key, {
      api_host: "/ph",
      ui_host: "https://us.posthog.com",
      defaults: "2025-11-30",
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
