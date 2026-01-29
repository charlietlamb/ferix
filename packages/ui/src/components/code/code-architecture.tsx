"use client";

import { useTranslations } from "next-intl";
import { DocCell, Gutter } from "./doc-components";

const FLOW_STEPS = [
  {
    key: "setup",
    num: "01",
    items: ["Create session", "Setup worktree", "Capture base branch"],
  },
  {
    key: "discovery",
    num: "02",
    items: ["Spawn fresh LLM", "Break down task", "Generate session name"],
  },
  {
    key: "iteration",
    num: "03",
    items: ["Build prompt", "Spawn fresh LLM", "Parse signals", "Update plan"],
  },
  {
    key: "completion",
    num: "04",
    items: ["Commit changes", "Push branch", "Create PR"],
  },
] as const;

const COMPARISON_ITEMS = [
  {
    key: "pureRalph",
    code: "while :; do cat PROMPT.md | claude ; done",
  },
  {
    key: "ferixLoop",
    code: "ferix run --iterations 5 --verify 'bun test'",
  },
] as const;

const DIFFERENCES = [
  { key: "prompt", pure: "Static file", ferix: "Dynamic with plan state" },
  { key: "context", pure: "Codebase only", ferix: "Plan + signals" },
  { key: "isolation", pure: "None", ferix: "Git worktree" },
  { key: "tracking", pure: "Manual", ferix: "Structured phases" },
] as const;

export function CodeArchitecture() {
  const t = useTranslations("code.architecture");

  return (
    <section className="overflow-hidden">
      <div className="-mr-px grid grid-cols-1 lg:grid-cols-6">
        <Gutter />

        {/* How It Works */}
        <DocCell
          className="lg:col-span-6"
          description={t("flowDesc")}
          showTitleBorder={false}
          title={t("flow")}
        >
          <div className="-mx-4 -my-4 divide-y divide-border border-border border-t">
            {FLOW_STEPS.map((step) => (
              <div
                className="grid grid-cols-[auto_1fr_2fr] items-center gap-4 px-4 py-3"
                key={step.key}
              >
                <code className="font-mono text-muted-foreground text-xs">
                  {step.num}
                </code>
                <span className="text-foreground text-xs">
                  {t(`${step.key}Title`)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {step.items.join(" → ")}
                </span>
              </div>
            ))}
          </div>
        </DocCell>

        <Gutter />

        {/* Comparison */}
        {COMPARISON_ITEMS.map((item) => (
          <DocCell
            className="lg:col-span-3"
            description={t(`${item.key}Desc`)}
            key={item.key}
            title={t(item.key)}
          >
            <code className="block rounded border border-border bg-muted/50 p-3 font-mono text-foreground text-xs">
              {item.code}
            </code>
          </DocCell>
        ))}

        <Gutter />

        {/* Key Differences */}
        <DocCell
          className="lg:col-span-6"
          description={t("differencesDesc")}
          showTitleBorder={false}
          title={t("differences")}
        >
          <div className="-mx-4 -my-4 divide-y divide-border border-border border-t">
            <div className="grid grid-cols-3 gap-4 bg-muted/30 px-4 py-2">
              <span className="font-medium text-muted-foreground text-xs">
                {t("aspect")}
              </span>
              <span className="font-medium text-muted-foreground text-xs">
                {t("pureRalph")}
              </span>
              <span className="font-medium text-muted-foreground text-xs">
                {t("ferixLoop")}
              </span>
            </div>
            {DIFFERENCES.map((diff) => (
              <div className="grid grid-cols-3 gap-4 px-4 py-3" key={diff.key}>
                <span className="text-foreground text-xs">
                  {t(`diff_${diff.key}`)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {diff.pure}
                </span>
                <span className="text-muted-foreground text-xs">
                  {diff.ferix}
                </span>
              </div>
            ))}
          </div>
        </DocCell>

        <Gutter />
      </div>
    </section>
  );
}
