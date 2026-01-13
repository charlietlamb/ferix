"use client";

import { Input } from "@ferix/ui/components/ui/input";
import { Label } from "@ferix/ui/components/ui/label";
import { useFieldContext } from "@ferix/ui/hooks/form-context";
import { useUsernameAvailability } from "@ferix/ui/hooks/use-username-availability";
import { CheckIcon, SpinnerIcon, XIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { FieldInfo } from "./field-info";

interface UsernameFieldProps {
  label: string;
  placeholder?: string;
  currentUsername?: string | null;
}

export function UsernameField({
  label,
  placeholder,
  currentUsername,
}: UsernameFieldProps) {
  const t = useTranslations("settings.editUser");
  const field = useFieldContext<string>();
  const { status, setUsername } = useUsernameAvailability(currentUsername);

  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => {
          field.handleChange(e.target.value);
          setUsername(e.target.value);
        }}
        placeholder={placeholder}
        type="text"
        value={field.state.value}
      />
      <FieldInfo field={field} />
      {status !== "idle" && (
        <div className="flex items-center gap-1.5 text-sm">
          {status === "checking" && (
            <>
              <SpinnerIcon className="size-3.5 animate-spin" />
              <span className="text-muted-foreground">
                {t("usernameChecking")}
              </span>
            </>
          )}
          {status === "available" && (
            <>
              <CheckIcon className="size-3.5 text-green-500" />
              <span className="text-green-500">{t("usernameAvailable")}</span>
            </>
          )}
          {status === "taken" && (
            <>
              <XIcon className="size-3.5 text-red-500" />
              <span className="text-red-500">{t("usernameTaken")}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
