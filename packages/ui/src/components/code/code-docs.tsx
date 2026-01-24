"use client";

import { cn } from "@ferix/ui/lib/utils";
import { useTranslations } from "next-intl";
import { CodeBlock } from "./code-block";
import { INSTALL_COMMAND } from "./constants";

const CLI_OPTIONS = [
  { flag: "-i, --iterations <n>", key: "iterations" },
  { flag: "-c, --verify <commands...>", key: "verify" },
  { flag: "--branch <name>", key: "branch" },
  { flag: "--push", key: "push" },
  { flag: "--pr", key: "pr" },
  { flag: "--provider <name>", key: "provider" },
] as const;

const EXAMPLES = [
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
] as const;

interface DocCellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  showTitleBorder?: boolean;
}

function DocCell({
  title,
  description,
  children,
  className,
  showTitleBorder = true,
}: DocCellProps) {
  return (
    <div className={cn("border-border border-r border-b", className)}>
      <div className="flex h-full flex-col">
        <div className={cn("p-4", showTitleBorder && "border-border border-b")}>
          <span className="text-sm">{title}</span>
        </div>
        <div className="flex-1 p-4">{children}</div>
        <div className="border-border border-t p-4">
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Gutter() {
  return <div className="h-16 border-border border-b lg:col-span-6" />;
}

export function CodeDocs() {
  const t = useTranslations("code.docs");

  return (
    <section className="overflow-hidden">
      <div className="-mr-px grid grid-cols-1 lg:grid-cols-6">
        <Gutter />
        <DocCell
          className="lg:col-span-3"
          description={t("installationDesc")}
          title={t("installation")}
        >
          <CodeBlock code={INSTALL_COMMAND} />
        </DocCell>
        <DocCell
          className="lg:col-span-3"
          description={t("quickStartDesc")}
          title={t("quickStart")}
        >
          <CodeBlock code='ferix "Add auth to my app"' />
        </DocCell>
        <Gutter />
        <DocCell
          className="lg:col-span-6"
          description={t("optionsDesc")}
          showTitleBorder={false}
          title={t("options")}
        >
          <div className="-mx-4 -my-4 divide-y divide-border border-border border-t">
            {CLI_OPTIONS.map(({ flag, key }) => (
              <div className="flex items-center gap-4 px-4 py-3" key={key}>
                <code className="shrink-0 font-mono text-foreground text-xs">
                  {flag}
                </code>
                <span className="text-muted-foreground text-xs">
                  {t(`option_${key}`)}
                </span>
              </div>
            ))}
          </div>
        </DocCell>
        <Gutter />
        {EXAMPLES.map(({ key, code }) => (
          <DocCell
            className="lg:col-span-2"
            description={t(`example_${key}_desc`)}
            key={key}
            title={t(`example_${key}`)}
          >
            <CodeBlock code={code} />
          </DocCell>
        ))}
        <Gutter />
      </div>
    </section>
  );
}
