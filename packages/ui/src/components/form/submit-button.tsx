"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { useFormContext } from "@ferix/ui/hooks/form-context";
import { useTranslations } from "next-intl";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
}

export function SubmitButton({ label, loadingLabel }: SubmitButtonProps) {
  const form = useFormContext();
  const t = useTranslations("ui.form");

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? (loadingLabel ?? t("loading")) : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
