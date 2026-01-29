"use client";

import { Brain } from "../home/cli/brain";
import { CliHero } from "./cli-hero";

const SYNC_COMMAND = "npm i -g ferix-code";

export function SyncHero() {
  return (
    <CliHero
      command={SYNC_COMMAND}
      mascot={
        <Brain className="h-auto w-full max-w-[200px] text-foreground transition-colors duration-500 hover:text-primary md:max-w-[280px]" />
      }
      translationNamespace="sync"
    />
  );
}
