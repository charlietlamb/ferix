"use client";

import { Dialog, DialogContent } from "@ferix/ui/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ferix/ui/components/ui/tabs";
import { EditUserForm } from "@ferix/ui/forms/settings/edit-user-form";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { UserIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function SettingsDialog() {
  const t = useTranslations("settings");
  const { user } = useAuthenticated();
  const { close, stack } = useDialog();
  const isOpen = stack.some((dialog) => dialog.key === "settingsDialog");

  if (!user) {
    return null;
  }

  return (
    <Dialog onOpenChange={close} open={isOpen}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <div className="flex flex-col">
          <div className="p-6 pb-4">
            <h2 className="text-lg">{t("title")}</h2>
            <p className="text-muted-foreground text-sm">{t("description")}</p>
          </div>
          <Tabs className="flex-1" defaultValue="edit-user">
            <div className="border-b px-6">
              <TabsList variant="line">
                <TabsTrigger value="edit-user">
                  <UserIcon className="size-4" />
                  {t("editUser.title")}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent className="p-6" value="edit-user">
              <EditUserForm user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
