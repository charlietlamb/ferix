"use client";

import { CliDocs } from "./cli-docs";
import type { CliDocsConfig } from "./types";

const SYNC_DOCS_CONFIG: CliDocsConfig = {
  translationNamespace: "sync",
  quickStartCommand: "ferix sync",
  options: [
    { flag: "-p, --path <path>", key: "path" },
    { flag: "-d, --dry-run", key: "dryRun" },
    { flag: "-g, --global", key: "global" },
  ],
  examples: [
    { key: "basic", code: "ferix sync" },
    { key: "dryRun", code: "ferix sync --dry-run" },
    { key: "customPath", code: "ferix sync -p ./packages/app/package.json" },
    { key: "global", code: "ferix sync --global" },
  ],
  exampleColSpan: 3,
};

export function SyncDocs() {
  return <CliDocs config={SYNC_DOCS_CONFIG} />;
}
