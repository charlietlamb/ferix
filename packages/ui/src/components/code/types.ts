import type { ReactNode } from "react";

export interface CliOption {
  flag: string;
  key: string;
}

export interface CliExample {
  key: string;
  code: string;
}

export interface CliDocsConfig {
  translationNamespace: string;
  quickStartCommand: string;
  options: readonly CliOption[];
  examples: readonly CliExample[];
  exampleColSpan?: 2 | 3;
}

export interface CliHeroConfig {
  translationNamespace: string;
  command: string;
  mascot: ReactNode;
  badge?: ReactNode;
  learnMoreHref?: string;
  variant?: "default" | "compact";
}
