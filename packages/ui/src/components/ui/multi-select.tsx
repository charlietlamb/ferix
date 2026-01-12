"use client";

import type { ComponentType, KeyboardEvent, ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { XIcon } from "@phosphor-icons/react";
import { Badge } from "@ferix/ui/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@ferix/ui/components/ui/command";
import { cn } from "@ferix/ui/lib/utils";

export interface Option {
  label: string;
  value: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  disable?: boolean;
  group?: string;
}

interface MultiSelectProps {
  options: Option[];
  value?: Option[];
  onChange?: (options: Option[]) => void;
  placeholder?: string;
  emptyIndicator?: ReactNode;
  maxSelected?: number;
  hidePlaceholderWhenSelected?: boolean;
  hideClearAllButton?: boolean;
  disabled?: boolean;
  className?: string;
  badgeClassName?: string;
  groupBy?: boolean;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
  emptyIndicator,
  maxSelected,
  hidePlaceholderWhenSelected = false,
  hideClearAllButton = false,
  disabled = false,
  className,
  badgeClassName,
  groupBy = false,
}: MultiSelectProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleUnselect = useCallback(
    (option: Option) => {
      onChange?.(value.filter((v) => v.value !== option.value));
    },
    [onChange, value]
  );

  const handleSelect = useCallback(
    (option: Option) => {
      if (maxSelected && value.length >= maxSelected) {
        return;
      }
      const isSelected = value.some((v) => v.value === option.value);
      if (isSelected) {
        onChange?.(value.filter((v) => v.value !== option.value));
      } else {
        onChange?.([...value, option]);
      }
      setInputValue("");
    },
    [maxSelected, onChange, value]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "" && value.length > 0) {
            const lastOption = value[value.length - 1];
            if (lastOption) {
              handleUnselect(lastOption);
            }
          }
        }
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    [handleUnselect, value]
  );

  const selectables = useMemo(() => {
    return options.filter(
      (option) => !value.some((v) => v.value === option.value)
    );
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!inputValue) return selectables;
    return selectables.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, selectables]);

  const groupedOptions = useMemo(() => {
    if (!groupBy) return { "": filteredOptions };
    return filteredOptions.reduce<Record<string, Option[]>>((acc, option) => {
      const group = option.group || "";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(option);
      return acc;
    }, {});
  }, [filteredOptions, groupBy]);

  return (
    <Command
      className={cn(
        "overflow-visible bg-transparent",
        className
      )}
      onKeyDown={handleKeyDown}
      shouldFilter={false}
    >
      <div
        className={cn(
          "border-input ring-offset-background focus-within:ring-ring group rounded-md border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((option) => {
            const Icon = option.icon;
            return (
              <Badge
                className={cn("gap-1", badgeClassName)}
                key={option.value}
                variant="secondary"
              >
                {Icon && <Icon size={12} />}
                {option.label}
                <button
                  className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(option)}
                  type="button"
                >
                  <XIcon className="text-muted-foreground hover:text-foreground size-3" />
                </button>
              </Badge>
            );
          })}
          <CommandPrimitive.Input
            className={cn(
              "placeholder:text-muted-foreground ml-1 flex-1 bg-transparent outline-none",
              disabled && "cursor-not-allowed"
            )}
            disabled={disabled}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onValueChange={setInputValue}
            placeholder={
              hidePlaceholderWhenSelected && value.length > 0
                ? ""
                : placeholder
            }
            ref={inputRef}
            value={inputValue}
          />
          {!hideClearAllButton && value.length > 0 && (
            <button
              className="ring-offset-background focus:ring-ring rounded-full outline-none focus:ring-2 focus:ring-offset-2"
              onClick={() => onChange?.([])}
              type="button"
            >
              <XIcon className="text-muted-foreground hover:text-foreground size-4" />
            </button>
          )}
        </div>
      </div>
      <div className="relative mt-2">
        {open && filteredOptions.length > 0 && (
          <div className="bg-popover text-popover-foreground animate-in absolute bottom-full z-50 mb-1 w-full rounded-md border shadow-md outline-none">
            <CommandList className="max-h-64 overflow-y-auto">
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <CommandGroup
                  heading={group.charAt(0).toUpperCase() + group.slice(1) || undefined}
                  key={group || "ungrouped"}
                >
                  {groupOptions.map((option) => {
                    const isSelected = value.some(
                      (v) => v.value === option.value
                    );
                    const Icon = option.icon;
                    return (
                      <CommandItem
                        className={cn(
                          "cursor-pointer",
                          option.disable && "cursor-not-allowed opacity-50"
                        )}
                        data-checked={isSelected}
                        disabled={option.disable}
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onSelect={() => {
                          if (!option.disable) {
                            handleSelect(option);
                          }
                        }}
                      >
                        {Icon && <Icon size={16} color="default" />}
                        {option.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </div>
        )}
        {open && filteredOptions.length === 0 && (
          <div className="bg-popover text-popover-foreground animate-in absolute bottom-full z-50 mb-1 w-full rounded-md border shadow-md outline-none">
            <CommandList className="max-h-64 overflow-y-auto">
              <CommandEmpty className="text-muted-foreground">
                {emptyIndicator || "No results found."}
              </CommandEmpty>
            </CommandList>
          </div>
        )}
      </div>
    </Command>
  );
}
