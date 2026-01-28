"use client";

import { Label } from "@ferix/ui/components/ui/label";
import { MultiSelect } from "@ferix/ui/components/ui/multi-select";
import { useFieldContext } from "@ferix/ui/hooks/form-context";
import { getTagsByIds, tagsToOptions } from "@ferix/ui/lib/tags";
import { useMemo } from "react";

interface TagsFieldProps {
  label?: string;
  placeholder?: string;
  dropdownPosition?: "top" | "bottom";
}

export function TagsField({
  label,
  placeholder,
  dropdownPosition,
}: TagsFieldProps = {}) {
  const field = useFieldContext<string[]>();

  const tagOptions = useMemo(() => tagsToOptions(), []);

  const selectedTags = useMemo(() => {
    const tagObjects = getTagsByIds(field.state.value);
    return tagObjects.map((tag) => ({
      label: tag.label,
      value: tag.id,
      icon: tag.icon,
      group: tag.category,
    }));
  }, [field.state.value]);

  const handleChange = (newTags: { label: string; value: string }[]) => {
    field.handleChange(newTags.map((tag) => tag.value));
  };

  const multiSelect = (
    <MultiSelect
      dropdownPosition={dropdownPosition}
      groupBy
      onChange={handleChange}
      options={tagOptions}
      placeholder={placeholder}
      value={selectedTags}
    />
  );

  if (label) {
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        {multiSelect}
      </div>
    );
  }

  return multiSelect;
}
