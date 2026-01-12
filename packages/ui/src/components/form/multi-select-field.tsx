"use client";

import { Label } from "@ferix/ui/components/ui/label";
import { MultiSelect, type Option } from "@ferix/ui/components/ui/multi-select";
import { useFieldContext } from "@ferix/ui/hooks/form-context";
import { useMemo } from "react";
import { FieldInfo } from "./field-info";

interface MultiSelectFieldProps {
  label: string;
  options: Option[];
  placeholder?: string;
  maxSelected?: number;
  groupBy?: boolean;
}

export function MultiSelectField({
  label,
  options,
  placeholder,
  maxSelected,
  groupBy,
}: MultiSelectFieldProps) {
  const field = useFieldContext<string[]>();

  const selectedOptions = useMemo(() => {
    return options.filter((option) => field.state.value.includes(option.value));
  }, [field.state.value, options]);

  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <MultiSelect
        groupBy={groupBy}
        maxSelected={maxSelected}
        onChange={(opts) => field.handleChange(opts.map((o) => o.value))}
        options={options}
        placeholder={placeholder}
        value={selectedOptions}
      />
      <FieldInfo field={field} />
    </div>
  );
}
