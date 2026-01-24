"use client";

import { cn } from "@ferix/ui/lib/utils";
import { useTranslations } from "next-intl";

const FEATURE_KEYS = ["feature1", "feature2", "feature3"] as const;

interface CodeFeaturesProps {
  compact?: boolean;
}

export function CodeFeatures({ compact = false }: CodeFeaturesProps) {
  const t = useTranslations("code");

  return (
    <div className="grid flex-1 grid-cols-1 divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">
      {FEATURE_KEYS.map((key) => (
        <div
          className={cn("flex flex-col gap-2", compact ? "p-4" : "p-6")}
          key={key}
        >
          <h3 className={cn("font-medium", compact && "text-sm")}>
            {t(`${key}Title`)}
          </h3>
          <p
            className={cn(
              "text-muted-foreground",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {t(`${key}Description`)}
          </p>
        </div>
      ))}
    </div>
  );
}
