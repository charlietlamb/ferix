"use client";

import { Link } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import { CategoryGridHeader } from "@ferix/ui/components/home/categories/category-grid-header";
import { AnimatedSkeleton } from "@ferix/ui/components/ui/animated-skeleton";
import { getTagsByIds } from "@ferix/ui/lib/tags";
import { cn } from "@ferix/ui/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
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

/** Stagger delay between grid items (in seconds) */
const STAGGER_DELAY = 0.03;

/** Animation configuration for grid items */
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * STAGGER_DELAY,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  }),
};

function CategoryCell({
  tagId,
  label,
  Icon,
  count,
  index,
}: {
  tagId: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  count: number | undefined;
  index: number;
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
          <AnimatedSkeleton
            className="mt-0.5 h-3 w-14"
            delay={index * STAGGER_DELAY}
            variant="text"
          />
        )}
      </div>
    </Link>
  );
}

function CategoryGridInner({
  categories,
  counts,
  isLoading,
}: {
  categories: ReturnType<typeof getTagsByIds>;
  counts: Record<string, number> | undefined;
  isLoading: boolean;
}) {
  return (
    <div>
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {categories.map((tag, i) => {
          const borderClasses = cn(
            "border-border",
            i % 2 !== 1 && "max-md:border-r",
            i % 4 !== 3 && "md:border-r",
            i < 6 && "max-md:border-b",
            i < 4 && "md:border-b"
          );

          // Use motion.li only when data is loaded for smooth entrance
          if (!isLoading) {
            return (
              <motion.li
                animate="visible"
                className={borderClasses}
                custom={i}
                initial="hidden"
                key={tag.id}
                variants={itemVariants}
              >
                <CategoryCell
                  count={counts?.[tag.id]}
                  Icon={tag.icon}
                  index={i}
                  label={tag.label}
                  tagId={tag.id}
                />
              </motion.li>
            );
          }

          return (
            <li className={borderClasses} key={tag.id}>
              <CategoryCell
                count={counts?.[tag.id]}
                Icon={tag.icon}
                index={i}
                label={tag.label}
                tagId={tag.id}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CategoryGridSkeleton() {
  const categories = getTagsByIds(TOP_CATEGORY_IDS);
  return (
    <section className="flex flex-col border-border border-b">
      <CategoryGridHeader />
      <CategoryGridInner
        categories={categories}
        counts={undefined}
        isLoading={true}
      />
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
      <CategoryGridInner
        categories={categories}
        counts={counts}
        isLoading={false}
      />
    </section>
  );
}
