"use client";

import { CreatePromptButton } from "@ferix/ui/components/prompts/create-prompt-button";
import { SidebarTrigger, useSidebar } from "@ferix/ui/components/ui/sidebar";
import { AnimatePresence, motion } from "motion/react";

export function AppHeader() {
  const { open } = useSidebar();

  return (
    <header className="flex h-12 items-center justify-between gap-2 border-b px-4 md:rounded-t-2xl">
      <SidebarTrigger />
      <AnimatePresence>
        {!open && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.9 }}
            key="create-button"
            transition={{ duration: 0.15 }}
          >
            <CreatePromptButton size="icon" />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
