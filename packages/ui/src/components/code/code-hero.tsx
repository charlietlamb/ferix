"use client";

import { useTranslations } from "next-intl";
import { Ralph } from "../home/cli/ralph";
import { CodeFeatures } from "./code-features";
import { INSTALL_COMMAND } from "./constants";
import { TerminalCommand } from "./terminal-command";

export function CodeHero() {
  const t = useTranslations("code");

  return (
    <section className="flex flex-col border-border border-b">
      <div className="flex divide-x">
        <div className="flex min-w-0 flex-1 flex-col divide-y">
          <div className="flex flex-col gap-2 p-4">
            <h1 className="text-4xl tracking-tighter md:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex flex-col">
            <TerminalCommand command={INSTALL_COMMAND} variant="hero" />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center bg-muted/20 p-8 md:p-12">
          <Ralph className="h-auto w-full max-w-[200px] text-foreground md:max-w-[280px]" />
        </div>
      </div>

      <CodeFeatures />
    </section>
  );
}
