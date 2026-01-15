"use client";

import { Link } from "@ferix/i18n/navigation";
import {
  getTagsByCategory,
  type Tag,
  type TagCategory,
  tagCategories,
} from "@ferix/ui/lib/tags";
import { cn } from "@ferix/ui/lib/utils";
import { useTranslations } from "next-intl";

function TagCell({ tag }: { tag: Tag }) {
  const Icon = tag.icon;
  return (
    <Link
      className="flex h-16 items-center gap-3 px-4 transition-colors hover:bg-muted/50"
      href={`/tag/${tag.id}`}
    >
      <Icon size={20} />
      <span className="font-medium text-sm">{tag.label}</span>
    </Link>
  );
}

function CategorySection({ category }: { category: TagCategory }) {
  const t = useTranslations("pages.tags.categories");
  const tags = getTagsByCategory(category);
  const lastRowMobile = Math.ceil(tags.length / 2) - 1;
  const lastRowDesktop = Math.ceil(tags.length / 4) - 1;

  return (
    <section className="border-border border-b">
      <div className="border-border border-b px-4 py-2">
        <h2 className="font-medium text-lg capitalize tracking-tight">
          {t(category)}
        </h2>
      </div>
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {tags.map((tag, i) => {
          const rowMobile = Math.floor(i / 2);
          const rowDesktop = Math.floor(i / 4);
          const isLastRowMobile = rowMobile === lastRowMobile;
          const isLastRowDesktop = rowDesktop === lastRowDesktop;

          return (
            <li
              className={cn(
                "border-border",
                i % 2 !== 1 && "max-md:border-r",
                i % 4 !== 3 && "md:border-r",
                !isLastRowMobile && "max-md:border-b",
                !isLastRowDesktop && "md:border-b"
              )}
              key={tag.id}
            >
              <TagCell tag={tag} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TagsContent() {
  return (
    <div className="flex-1 overflow-y-auto">
      {tagCategories.map((category) => (
        <CategorySection category={category} key={category} />
      ))}
    </div>
  );
}
