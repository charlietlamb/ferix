import { Link } from "@ferix/i18n/navigation";
import { CirclesThreeIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";

export function Logo({ showText }: { showText: boolean }) {
  return (
    <Link
      className="group/logo flex h-9 items-center justify-center gap-1"
      href="/"
    >
      <CirclesThreeIcon className="mt-0.5 size-4" weight="bold" />
      <AnimatePresence>
        {showText && (
          <motion.span
            animate={{ opacity: 1, width: "auto" }}
            className="overflow-hidden whitespace-nowrap font-bold italic tracking-tight group-hover/logo:underline"
            exit={{ opacity: 0, width: 0 }}
            initial={{ opacity: 0, width: 0 }}
            key="logo-text"
            transition={{ duration: 0.15 }}
          >
            ferix
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
