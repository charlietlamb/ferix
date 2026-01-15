"use client";

import { api } from "@ferix/server/_generated/api";
import { tags } from "@ferix/ui/lib/tags";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

function StatItem({
  value,
  label,
  isLast,
}: {
  value: number | undefined;
  label: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col gap-1 p-4 ${isLast ? "" : "border-border border-r"}`}
    >
      {value !== undefined ? (
        <span className="font-mono font-semibold text-2xl tabular-nums">
          {value.toLocaleString()}
        </span>
      ) : (
        <div className="my-1 h-6 w-12 animate-pulse rounded bg-muted" />
      )}
      <span className="text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function StatsSkeleton() {
  const t = useTranslations("stats");
  return (
    <section className="flex border-border border-b">
      <StatItem label={t("prompts")} value={undefined} />
      <StatItem label={t("downloads")} value={undefined} />
      <StatItem label={t("creators")} value={undefined} />
      <StatItem isLast label={t("categories")} value={undefined} />
    </section>
  );
}

export function StatsSection() {
  const t = useTranslations("stats");
  const stats = useQuery(api.stats.getStats);

  if (!stats) {
    return <StatsSkeleton />;
  }

  return (
    <section className="flex border-border border-b">
      <StatItem label={t("prompts")} value={stats.totalPrompts} />
      <StatItem label={t("downloads")} value={stats.totalDownloads} />
      <StatItem label={t("creators")} value={stats.totalCreators} />
      <StatItem isLast label={t("categories")} value={tags.length} />
    </section>
  );
}
