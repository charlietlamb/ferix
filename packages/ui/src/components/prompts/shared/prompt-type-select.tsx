"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ferix/ui/components/ui/select";
import {
  PROMPT_TYPES,
  type PromptType,
  promptTypeConfigs,
} from "@ferix/ui/lib/prompt-types";

interface PromptTypeSelectProps {
  value: PromptType;
  onChange: (value: PromptType) => void;
  disabled?: boolean;
}

export function PromptTypeSelect({
  value,
  onChange,
  disabled,
}: PromptTypeSelectProps) {
  const currentConfig = promptTypeConfigs[value];
  const CurrentIcon = currentConfig.icon;

  return (
    <Select
      disabled={disabled}
      onValueChange={(val) => {
        if (val) {
          onChange(val as PromptType);
        }
      }}
      value={value}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          <CurrentIcon className="size-4" />
          <span>{currentConfig.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PROMPT_TYPES.map((type) => {
          const config = promptTypeConfigs[type];
          const Icon = config.icon;
          return (
            <SelectItem key={type} value={type}>
              <Icon className="size-4" />
              <span>{config.label}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
