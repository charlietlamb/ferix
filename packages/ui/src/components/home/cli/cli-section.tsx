"use client";

import { Link } from "@ferix/i18n/navigation";
import { INSTALL_COMMAND } from "@ferix/ui/components/code/constants";
import { TerminalCommand } from "@ferix/ui/components/code/terminal-command";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function CLISection() {
  const t = useTranslations("cli");

  return (
    <section className="flex flex-col border-border border-b">
      {/* Header */}
      <div className="flex items-center justify-between border-border border-b">
        <div className="flex flex-col gap-1 px-4 py-2">
          <h2 className="text-lg tracking-tight">{t("title")}</h2>
        </div>
        <Link
          className="flex h-full items-center gap-1 pr-2 text-muted-foreground text-xs hover:text-foreground"
          href="/code"
        >
          {t("learnMore")}
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        <p className="border-border border-b p-4 text-muted-foreground text-sm">
          {t("description")}
        </p>
        <TerminalCommand command={INSTALL_COMMAND} />
      </div>
    </section>
  );
}
