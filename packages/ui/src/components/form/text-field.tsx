"use client";

import { Input } from "@ferix/ui/components/ui/input";
import { Label } from "@ferix/ui/components/ui/label";
import { useFieldContext } from "@ferix/ui/hooks/form-context";
import { FieldInfo } from "./field-info";

interface TextFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

export function TextField({
  label,
  type = "text",
  placeholder,
  onValueChange,
}: TextFieldProps) {
  const field = useFieldContext<string>();

  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => {
          field.handleChange(e.target.value);
          onValueChange?.(e.target.value);
        }}
        placeholder={placeholder}
        type={type}
        value={field.state.value}
      />
      <FieldInfo field={field} />
    </div>
  );
}
