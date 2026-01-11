"use client";

import { updateUser } from "@ferix/auth/client";
import { ChangePasswordSection } from "@ferix/ui/components/settings/change-password-section";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import type { User } from "better-auth";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { editUserFormSchema } from "./edit-user-form-schema";

export function EditUserForm({ user }: { user: User }) {
  const t = useTranslations("settings.editUser");

  const form = useAppForm({
    defaultValues: { name: user.name },
    validators: { onChange: editUserFormSchema },
    onSubmit: async ({ value }) => {
      const { error } = await updateUser({ name: value.name });

      if (error) {
        toast.error(error.message ?? t("error"));
        return;
      }

      toast.success(t("success"));
    },
  });

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <h2 className="font-medium leading-none">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.AppField name="name">
          {(field) => <field.TextField label={t("name")} type="text" />}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label={t("submit")} />
        </form.AppForm>
      </form>
      <ChangePasswordSection />
    </div>
  );
}
