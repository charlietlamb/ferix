"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { CreateMenuCell } from "@ferix/ui/components/create/create-menu-cell";
import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { FilePlusIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function CreateMenuDialog() {
  const t = useTranslations("createMenu");
  const router = useRouter();
  const { close, open } = useDialog();

  const handleCreatePrompt = () => {
    close();
    router.push("/create-prompt");
  };

  const handleAddRepository = () => {
    close();
    open("addRepositoryDialog");
  };

  return (
    <BaseDialog
      description={t("description")}
      dialogKey="createMenuDialog"
      size="md"
      title={t("title")}
    >
      <div className="grid grid-cols-2 border border-border">
        <CreateMenuCell
          className="border-border border-r"
          description={t("prompt.description")}
          icon={FilePlusIcon}
          onClick={handleCreatePrompt}
          title={t("prompt.title")}
        />
        <CreateMenuCell
          description={t("repository.description")}
          icon={SiGithub}
          onClick={handleAddRepository}
          title={t("repository.title")}
        />
      </div>
    </BaseDialog>
  );
}
