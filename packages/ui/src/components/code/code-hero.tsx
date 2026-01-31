"use client";

import { cn } from "@ferix/ui/lib/utils";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Ralph } from "../home/cli/ralph";
import { CliHero } from "./cli-hero";
import { INSTALL_COMMAND } from "./constants";

interface CodeHeroProps {
  variant?: "default" | "compact";
}

export function CodeHero({ variant = "default" }: CodeHeroProps) {
  const isCompact = variant === "compact";

  return (
    <CliHero
      badge={
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-500 text-xs">
          <WarningCircleIcon className="size-3" weight="fill" />
          Experimental
        </span>
      }
      command={INSTALL_COMMAND}
      learnMoreHref="/code"
      mascot={
        <Ralph
          className={cn(
            "h-auto w-full text-foreground transition-colors duration-500 hover:text-primary",
            isCompact
              ? "max-w-[150px] md:max-w-[200px]"
              : "max-w-[200px] md:max-w-[280px]"
          )}
        />
      }
      translationNamespace="code"
      variant={variant}
    />
  );
}
