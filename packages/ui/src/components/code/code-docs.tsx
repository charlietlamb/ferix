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
      key: "autonomous",
      code: 'ferix "Refactor the API layer" -i 10',
    },
    {
      key: "workflow",
      code: 'ferix "Add dark mode support" \\\n  --branch feat/dark-mode \\\n  --push --pr',
    },
    {
      key: "prd",
      code: 'ferix "Complete all tasks in PRD.md"',
    },
    {
      key: "provider",
      code: 'ferix "Add caching layer" --provider cursor',
    },
  ],
  exampleColSpan: 2,
};

export function CodeDocs() {
  return <CliDocs config={CODE_DOCS_CONFIG} />;
}
