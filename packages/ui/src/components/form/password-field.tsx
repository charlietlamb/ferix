"use client";

import { Input } from "@ferix/ui/components/ui/input";
import { Label } from "@ferix/ui/components/ui/label";
import { useFieldContext } from "@ferix/ui/hooks/form-context";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { FieldInfo } from "./field-info";

interface PasswordFieldProps {
  label: string;
  placeholder?: string;
}

export function PasswordField({ label, placeholder }: PasswordFieldProps) {
  const field = useFieldContext<string>();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <div className="relative">
        <Input
          id={field.name}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          type={showPassword ? "text" : "password"}
          value={field.state.value}
        />
        <button
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowPassword(!showPassword)}
          type="button"
        >
          {showPassword ? (
            <EyeSlashIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </button>
      </div>
      <FieldInfo field={field} />
    </div>
  );
}
