"use client";

import { MultiSelect } from "@ferix/ui/components/ui/multi-select";
import { useFieldContext } from "@ferix/ui/hooks/form-context";
import { getTagsByIds, tagsToOptions } from "@ferix/ui/lib/tags";
import { useMemo } from "react";

interface TagsFieldProps {
  placeholder?: string;
  dropdownPosition?: "top" | "bottom";
}

export function TagsField({
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

  return (
    <MultiSelect
      dropdownPosition={dropdownPosition}
      groupBy
      onChange={handleChange}
      options={tagOptions}
      placeholder={placeholder}
      value={selectedTags}
    />
  );
}
