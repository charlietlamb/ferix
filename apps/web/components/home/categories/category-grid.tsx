"use client";

import { Link } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import { getTagsByIds } from "@ferix/ui/lib/tags";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

const TOP_CATEGORY_IDS = [
  "typescript",
  "nextjs",
  "react",
  "drizzle",
  "prisma",
  "tailwindcss",
  "python",
  "rust",
];

function CategoryCell({
  tagId,
  label,
  Icon,
  count,
  isLastInRow,
  isLastRow,
}: {
  tagId: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  count: number | undefined;
  isLastInRow: boolean;
  isLastRow: boolean;
}) {
  const t = useTranslations("categories");
  return (
    <Link
      className={`flex items-center gap-3 p-4 transition-colors hover:bg-muted/50 ${isLastInRow ? "" : "border-border border-r"} ${isLastRow ? "" : "border-border border-b"}`}
      href={`/tag/${tagId}`}
    >
      <Icon size={24} />
      <div className="flex flex-col">
        <span className="font-medium text-sm">{label}</span>
        {count !== undefined ? (
          <span className="text-muted-foreground text-xs">
            {t("promptCount", { count })}
          </span>
        ) : (
          <div className="mt-0.5 h-3 w-14 animate-pulse rounded bg-muted" />
        )}
      </div>
    </Link>
  );
}

function CategoryGridSkeleton() {
  const categories = getTagsByIds(TOP_CATEGORY_IDS);

  return (
    <section className="flex flex-col border-border border-t">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {categories.map((tag, index) => {
          const isLastInRow = (index + 1) % 4 === 0;
          const isLastRow = index >= categories.length - 4;
          return (
            <CategoryCell
              count={undefined}
              Icon={tag.icon}
              isLastInRow={isLastInRow}
              isLastRow={isLastRow}
              key={tag.id}
              label={tag.label}
              tagId={tag.id}
            />
          );
        })}
      </div>
    </section>
  );
}

export function CategoryGrid() {
  const categories = getTagsByIds(TOP_CATEGORY_IDS);
  const counts = useQuery(api.stats.countByTags, { tags: TOP_CATEGORY_IDS });

  if (!counts) {
    return <CategoryGridSkeleton />;
  }

  return (
    <section className="flex flex-col border-border border-t">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {categories.map((tag, index) => {
          const isLastInRow = (index + 1) % 4 === 0;
          const isLastRow = index >= categories.length - 4;
          return (
            <CategoryCell
              count={counts[tag.id] ?? 0}
              Icon={tag.icon}
              isLastInRow={isLastInRow}
              isLastRow={isLastRow}
              key={tag.id}
              label={tag.label}
              tagId={tag.id}
            />
          );
        })}
      </div>
    </section>
  );
}
