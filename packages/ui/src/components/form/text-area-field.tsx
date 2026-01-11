"use client";

import { Label } from "@ferix/ui/components/ui/label";
import { Textarea } from "@ferix/ui/components/ui/textarea";
import { useFieldContext } from "@ferix/ui/hooks/form-context";
import { FieldInfo } from "./field-info";

interface TextAreaFieldProps {
  label: string;
  placeholder?: string;
}

export function TextAreaField({ label, placeholder }: TextAreaFieldProps) {
  const field = useFieldContext<string>();

  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Textarea
        id={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        value={field.state.value}
      />
      <FieldInfo field={field} />
    </div>
  );
}
