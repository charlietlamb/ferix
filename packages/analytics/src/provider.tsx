"use client";

import { env } from "@ferix/env/nextjs";
import { PostHogProvider } from "@posthog/react";
import posthog from "posthog-js";
import { type ReactNode, useEffect } from "react";
import { PostHogPageview } from "./pageview";

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

    const key = env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) {
      return;
    }

    posthog.init(key, {
      api_host: "/ph",
      ui_host: "https://us.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: false,
      __add_tracing_headers: [new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname],
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <PostHogPageview />
      {children}
    </PostHogProvider>
  );
}
