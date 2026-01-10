import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: AnyFieldApi }) {
  return field.state.meta.isTouched && !field.state.meta.isValid ? (
    <p className="text-destructive text-sm">
      {field.state.meta.errors.map((e) => e.message).join(", ")}
    </p>
  ) : null;
}
