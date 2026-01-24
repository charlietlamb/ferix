"use client";

import { Link } from "@ferix/i18n/navigation";
import { cn } from "@ferix/ui/lib/utils";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { Ralph } from "../home/cli/ralph";
import { CodeFeatures } from "./code-features";
import { INSTALL_COMMAND } from "./constants";
import { TerminalCommand } from "./terminal-command";

interface CodeHeroProps {
  variant?: "default" | "compact";
}

export function CodeHero({ variant = "default" }: CodeHeroProps) {
  const t = useTranslations("code");
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
                  : "text-4xl md:text-5xl lg:text-6xl"
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
          {isCompact && (
            <Link
              className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
              href="/code"
            >
              {t("learnMore")}
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </div>
        <TerminalCommand
          command={INSTALL_COMMAND}
          variant={isCompact ? "compact" : "hero"}
        />
        <CodeFeatures compact={isCompact} />
      </div>

      <div
        className={cn(
          "hideden flex shrink-0 items-center justify-center border-border border-t bg-muted/20 lg:block lg:border-t-0 lg:border-l",
          isCompact ? "p-6 md:p-8" : "p-8 md:p-12"
        )}
      >
        <Ralph
          className={cn(
            "h-auto w-full text-foreground transition-colors duration-500 hover:text-primary",
            isCompact
              ? "max-w-[150px] md:max-w-[200px]"
              : "max-w-[200px] md:max-w-[280px]"
          )}
        />
      </div>
    </section>
  );
}
