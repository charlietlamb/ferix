"use client";

import { CommandPaletteTrigger } from "@ferix/ui/components/command-palette/command-palette-trigger";
import { useCommandK } from "@ferix/ui/components/command-palette/hooks/use-command-k";
import { CreatePromptButton } from "@ferix/ui/components/prompts/create/create-prompt-button";
import { SidebarTrigger, useSidebar } from "@ferix/ui/components/ui/sidebar";
import { AnimatePresence, motion } from "motion/react";

const layoutTransition = { duration: 0.2, ease: "linear" as const };

export function DashboardHeader() {
  const { open } = useSidebar();
  useCommandK();

  return (
    <header className="z-10 flex h-12 items-center justify-between gap-2 border-b px-2 md:rounded-t-2xl">
      <motion.div layout transition={layoutTransition}>
        <SidebarTrigger />
      </motion.div>
      <motion.div
        className="flex-1 md:max-w-64"
        layout
        transition={layoutTransition}
      >
        <CommandPaletteTrigger />
      </motion.div>
      <AnimatePresence mode="popLayout">
        {!open && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.9 }}
            key="create-button"
            layout
            transition={layoutTransition}
          >
            <CreatePromptButton size="icon" />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
