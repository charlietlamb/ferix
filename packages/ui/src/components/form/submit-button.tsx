"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { useFormContext } from "@ferix/ui/hooks/form-context";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
}

export function SubmitButton({ label, loadingLabel }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? (loadingLabel ?? "Loading...") : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
