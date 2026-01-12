"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { SidebarTrigger, useSidebar } from "@ferix/ui/components/ui/sidebar";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";

export function AppHeader() {
  const { open: openDialog } = useDialog();
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
            <Button
              onClick={() => openDialog("createPromptDialog")}
              size="icon"
              variant="ghost"
            >
              <PlusIcon className="size-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
