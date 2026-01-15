"use client";

import { Link } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import { CategoryGridHeader } from "@ferix/ui/components/home/categories/category-grid-header";
import { getTagsByIds } from "@ferix/ui/lib/tags";
import { cn } from "@ferix/ui/lib/utils";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

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
}: {
  tagId: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  count: number | undefined;
}) {
  const t = useTranslations("categories");
  return (
    <Link
      className="flex h-24 items-center gap-3 p-6 transition-colors hover:bg-muted/50"
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

function CategoryGridInner({
  categories,
  counts,
}: {
  categories: ReturnType<typeof getTagsByIds>;
  counts: Record<string, number> | undefined;
}) {
  return (
    <div>
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {categories.map((tag, i) => (
          <li
            className={cn(
              "border-border",
              // Right border on all except last in row
              i % 2 !== 1 && "max-md:border-r",
              i % 4 !== 3 && "md:border-r",
              // Bottom border on all except last row
              i < 6 && "max-md:border-b",
              i < 4 && "md:border-b"
            )}
            key={tag.id}
          >
            <CategoryCell
              count={counts?.[tag.id]}
              Icon={tag.icon}
              label={tag.label}
              tagId={tag.id}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryGridSkeleton() {
  const categories = getTagsByIds(TOP_CATEGORY_IDS);
  return (
    <section className="flex flex-col border-border border-b">
      <CategoryGridHeader />
      <CategoryGridInner categories={categories} counts={undefined} />
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
    <section className="flex flex-col border-border border-b">
      <CategoryGridHeader />
      <CategoryGridInner categories={categories} counts={counts} />
    </section>
  );
}
