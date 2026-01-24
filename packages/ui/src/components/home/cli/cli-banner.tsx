"use client";

import { Link } from "@ferix/i18n/navigation";
import { ArrowRightIcon, TerminalIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.008,
    },
  },
};

const charVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function CLIBanner() {
  const t = useTranslations("cli");
  const text = t("banner");

  return (
    <Link
      className="shimmer flex items-center gap-2 border-border border-b bg-muted/30 px-4 py-2 transition-colors hover:bg-muted/50"
      href="/code"
    >
      <TerminalIcon className="size-4 shrink-0" />
      <motion.span
        animate="visible"
        className="truncate text-sm"
        initial="hidden"
        variants={containerVariants}
      >
        {text.split("").map((char, index) => (
          <motion.span
            className={char === " " ? "inline" : "inline-block"}
            key={`${char}-${index}`}
            variants={charVariants}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
      <ArrowRightIcon className="ml-auto size-4 shrink-0" />
    </Link>
  );
}
