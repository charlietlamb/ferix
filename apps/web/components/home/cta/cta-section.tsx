"use client";

import { Link } from "@ferix/i18n/navigation";
import { ArrowRightIcon, PlusIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function CTASection() {
  const t = useTranslations("cta");
  return (
    <section className="grid grid-cols-2 border-border border-t md:grid-cols-4">
      <div className="col-span-2 flex flex-col justify-center gap-2 border-border border-r p-4">
        <h2 className="font-medium text-xl tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <Link
        className="flex flex-col items-center justify-center gap-2 border-border border-r p-4 transition-colors hover:bg-muted/50"
        href="/create-prompt"
      >
        <PlusIcon className="size-6" />
        <span className="font-medium text-sm">{t("create")}</span>
      </Link>
      <Link
        className="flex flex-col items-center justify-center gap-2 p-4 transition-colors hover:bg-muted/50"
        href="/popular"
      >
        <ArrowRightIcon className="size-6" />
        <span className="font-medium text-sm">{t("browse")}</span>
      </Link>
    </section>
  );
}
