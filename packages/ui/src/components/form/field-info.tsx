import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: AnyFieldApi }) {
  return field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
    <p className="text-destructive text-sm">
      {field.state.meta.errors[0]?.message}
    </p>
  ) : null;
}
