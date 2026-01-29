"use client";

import { CliDocs } from "./cli-docs";
import type { CliDocsConfig } from "./types";

const CODE_DOCS_CONFIG: CliDocsConfig = {
  translationNamespace: "code",
  quickStartCommand: 'ferix "Add auth to my app"',
  noticeKey: "yoloNotice",
  options: [
    { flag: "-i, --iterations <n>", key: "iterations" },
    { flag: "-c, --verify <commands...>", key: "verify" },
    { flag: "--branch <name>", key: "branch" },
    { flag: "--push", key: "push" },
    { flag: "--pr", key: "pr" },
    { flag: "--provider <name>", key: "provider" },
    { flag: "--no-yolo", key: "noYolo" },
    { flag: "-d, --debug", key: "debug" },
  ],
  examples: [
    { key: "basic", code: 'ferix "Add user authentication"' },
    {
      key: "verification",
      code: 'ferix "Fix login bug" -c "bun test" -c "bun lint"',
    },
    {
      key: "workflow",
      code: 'ferix "Add dark mode support" \\\n  --branch feat/dark-mode \\\n  --push --pr',
    },
    {
      key: "linear",
      code: 'ferix "Go through all the tickets on the chatbot Linear project and complete each one"',
    },
    {
      key: "github",
      code: 'ferix "Go through all of the GitHub issues and fix each one"',
    },
    {
      key: "prd",
      code: 'ferix "Search the PRD.md file and complete all of the tasks"',
    },
  ],
  exampleColSpan: 2,
};

export function CodeDocs() {
  return <CliDocs config={CODE_DOCS_CONFIG} />;
}
