"use client";

import { type UserWithUsername, updateUser } from "@ferix/auth/client";
import { UsernameField } from "@ferix/ui/components/form/username-field";
import { ChangePasswordSection } from "@ferix/ui/components/settings/change-password-section";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { editUserFormSchema } from "./edit-user-form-schema";

export function EditUserForm({ user }: { user: UserWithUsername }) {
  const t = useTranslations("settings.editUser");

  const form = useAppForm({
    defaultValues: {
      name: user.name,
      username: user.username ?? "",
    },
    validators: { onChange: editUserFormSchema },
    onSubmit: async ({ value }) => {
      const { error } = await updateUser({
        name: value.name,
        username: value.username,
      });

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
        <form.AppField name="username">
          {() => (
            <UsernameField
              currentUsername={user.username}
              label={t("username")}
              placeholder={t("usernamePlaceholder")}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label={t("submit")} />
        </form.AppForm>
      </form>
      <ChangePasswordSection />
    </div>
  );
}
