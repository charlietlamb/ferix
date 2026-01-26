"use client";

import { Link } from "@ferix/i18n/navigation";
import { cn } from "@ferix/ui/lib/utils";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Features } from "./features";
import { TerminalCommand } from "./terminal-command";

interface CliHeroProps {
  translationNamespace: string;
  command: string;
  mascot: ReactNode;
  badge?: ReactNode;
  learnMoreHref?: string;
  variant?: "default" | "compact";
}

export function CliHero({
  translationNamespace,
  command,
  mascot,
  badge,
  learnMoreHref,
  variant = "default",
}: CliHeroProps) {
  const t = useTranslations(translationNamespace);
  const isCompact = variant === "compact";

  return (
    <section className="flex flex-col border-border border-b lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col divide-y">
        <div
          className={cn(
            "flex items-center justify-between gap-4 p-4",
            isCompact && "p-2 px-4"
          )}
        >
          <div className={cn("flex flex-col gap-2", isCompact && "gap-1")}>
            <h1
              className={cn(
                isCompact
                  ? "text-lg md:text-xl"
                  : "text-2xl md:text-3xl lg:text-4xl"
              )}
            >
              {t("title")}
            </h1>
            <p
              className={cn(
                "text-muted-foreground",
                isCompact ? "text-sm" : ""
              )}
            >
              {t("description")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {badge}
            {isCompact && learnMoreHref && (
              <Link
                className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
                href={learnMoreHref}
              >
                {t("learnMore")}
                <ArrowRightIcon className="size-4" />
              </Link>
            )}
          </div>
        </div>
        <TerminalCommand
          command={command}
          variant={isCompact ? "compact" : "hero"}
        />
        <Features
          compact={isCompact}
          translationNamespace={translationNamespace}
        />
      </div>

      <div
        className={cn(
          "hidden shrink-0 items-center justify-center border-border border-t bg-muted/20 lg:flex lg:border-t-0 lg:border-l",
          isCompact ? "p-6 md:p-8" : "p-8 md:p-12"
        )}
      >
        {mascot}
      </div>
    </section>
  );
}
