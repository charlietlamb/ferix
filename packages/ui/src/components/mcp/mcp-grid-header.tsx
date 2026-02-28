"use client";

import { Link } from "@ferix/i18n/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function McpGridHeader() {
  const t = useTranslations("mcp");

  return (
    <div className="flex items-center justify-between border-border border-b">
      <div className="flex flex-col gap-1 px-4 py-2">
        <h2 className="text-lg tracking-tight">{t("title")}</h2>
      </div>
      <Link
        className="flex h-full items-center gap-1 pr-2 text-muted-foreground text-xs hover:text-foreground"
        href="/mcp"
      >
        {t("viewAll")}
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  );
}
