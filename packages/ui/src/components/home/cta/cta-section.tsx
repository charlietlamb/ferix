"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { DownloadSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function CTASection() {
  const t = useTranslations("cta");
  const router = useRouter();
  const { isAuthenticated } = useAuthenticated();
  const { open: openDialog } = useDialog();

  const handleCreateClick = () => {
    if (isAuthenticated) {
      router.push("/create-prompt");
    } else {
      openDialog("signInDialog");
    }
  };

  const handleImportClick = () => {
    if (isAuthenticated) {
      openDialog("addRepositoryDialog");
    } else {
      openDialog("signInDialog");
    }
  };

  return (
    <section className="grid grid-cols-2 border-border border-b md:grid-cols-4">
      <div className="col-span-2 flex flex-col justify-center gap-2 border-border border-r p-4">
        <h2 className="font-medium text-xl tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <button
        className="flex flex-col items-center justify-center gap-2 border-border border-r p-4 transition-colors hover:bg-muted/50"
        onClick={handleCreateClick}
        type="button"
      >
        <PlusIcon className="size-6" />
        <span className="font-medium text-sm">{t("create")}</span>
      </button>
      <button
        className="flex flex-col items-center justify-center gap-2 p-4 transition-colors hover:bg-muted/50"
        onClick={handleImportClick}
        type="button"
      >
        <DownloadSimpleIcon className="size-6" />
        <span className="font-medium text-sm">{t("import")}</span>
      </button>
    </section>
  );
}
