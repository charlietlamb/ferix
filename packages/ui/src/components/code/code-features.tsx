"use client";

import { useTranslations } from "next-intl";

export function CodeFeatures() {
  const t = useTranslations("code");

  return (
    <div className="grid grid-cols-1 border-border border-t md:grid-cols-3">
      <div className="flex flex-col gap-2 border-border border-b p-6 md:border-r md:border-b-0">
        <h3 className="font-medium">{t("feature1Title")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("feature1Description")}
        </p>
      </div>
      <div className="flex flex-col gap-2 border-border border-b p-6 md:border-r md:border-b-0">
        <h3 className="font-medium">{t("feature2Title")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("feature2Description")}
        </p>
      </div>
      <div className="flex flex-col gap-2 p-6">
        <h3 className="font-medium">{t("feature3Title")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("feature3Description")}
        </p>
      </div>
    </div>
  );
}
