"use client";

import { ArrowRightIcon, XLogo } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function TwitterGridHeader() {
  const t = useTranslations("twitter");

  return (
    <div className="flex items-center justify-between border-border border-b">
      <div className="flex flex-col gap-1 px-4 py-2">
        <h2 className="text-lg tracking-tight">{t("title")}</h2>
      </div>
      <a
        className="flex h-full items-center gap-1 pr-2 text-muted-foreground text-xs hover:text-foreground"
        href="https://x.com/charlietlamb"
        rel="noopener noreferrer"
        target="_blank"
      >
        {t("viewOnX")}
        <XLogo className="size-3" />
        <ArrowRightIcon className="size-4" />
      </a>
    </div>
  );
}
