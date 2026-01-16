"use client";

import posthog from "posthog-js";
import { useCallback } from "react";
import {
  AnalyticsEvents,
  type PromptDownloadProperties,
  type PromptLinkCopyProperties,
} from "../events";

export function useTrack() {
  const trackPromptDownload = useCallback(
    (properties: PromptDownloadProperties) => {
      posthog.capture(AnalyticsEvents.PROMPT_DOWNLOAD, properties);
    },
    []
  );

  const trackPromptLinkCopy = useCallback(
    (properties: PromptLinkCopyProperties) => {
      posthog.capture(AnalyticsEvents.PROMPT_LINK_COPY, properties);
    },
    []
  );

  return {
    trackPromptDownload,
    trackPromptLinkCopy,
  };
}
