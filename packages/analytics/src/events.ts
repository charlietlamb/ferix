export const AnalyticsEvents = {
  PROMPT_DOWNLOAD: "prompt_download",
  PROMPT_LINK_COPY: "prompt_link_copy",
} as const;

export interface PromptDownloadProperties {
  promptId: string;
  promptSlug: string;
  promptTitle?: string;
}

export interface PromptLinkCopyProperties {
  promptId: string;
  promptSlug: string;
}
