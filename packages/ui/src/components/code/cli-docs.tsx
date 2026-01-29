"use client";

import { useTranslations } from "next-intl";
import { CliExamples } from "./cli-examples";
import { CliOptions } from "./cli-options";
import { CodeBlock } from "./code-block";
import { INSTALL_COMMAND } from "./constants";
import { DocCell, Gutter } from "./doc-components";
import type { CliDocsConfig } from "./types";

interface CliDocsProps {
  config: CliDocsConfig;
}

export function CliDocs({ config }: CliDocsProps) {
  const {
    translationNamespace,
    quickStartCommand,
    options,
    examples,
    exampleColSpan = 2,
    noticeKey,
  } = config;
  const t = useTranslations(`${translationNamespace}.docs`);

  return (
    <section className="overflow-hidden">
      <Gutter />
      <div className="-mr-px grid grid-cols-1 lg:grid-cols-6">
        {noticeKey && (
          <div className="flex items-center border-border border-b bg-muted/30 px-4 py-3 lg:col-span-6">
            <span className="text-muted-foreground text-xs">
              {t(noticeKey)}
            </span>
          </div>
        )}
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
          <CodeBlock code={quickStartCommand} />
        </DocCell>
        <Gutter />
        <DocCell
          className="lg:col-span-6"
          description={t("optionsDesc")}
          showTitleBorder={false}
          title={t("options")}
        >
          <CliOptions getTranslation={t} options={options} />
        </DocCell>
        <Gutter />
        <CliExamples
          colSpan={exampleColSpan}
          examples={examples}
          getTranslation={t}
        />
        <Gutter />
      </div>
    </section>
  );
}
