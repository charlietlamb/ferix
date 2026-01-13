"use client";

import { useCallback, useState } from "react";

interface UseInlineEditOptions<T> {
  initialValue: T;
  onSave: (value: T) => Promise<void>;
  validate?: (value: T) => boolean;
  onCancel?: () => void;
}

interface UseInlineEditReturn<T> {
  isEditing: boolean;
  isSaving: boolean;
  value: T;
  setValue: (value: T) => void;
  save: () => Promise<void>;
  cancel: () => void;
  startEditing: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Hook for managing inline editing state with save/cancel functionality.
 * Handles keyboard events (Enter to save, Escape to cancel).
 *
 * @example
 * const edit = useInlineEdit({
 *   initialValue: title,
 *   onSave: async (value) => await updateTitle(value),
 *   validate: (value) => value.trim() !== "",
 * });
 */
export function useInlineEdit<T>({
  initialValue,
  onSave,
  validate,
  onCancel,
}: UseInlineEditOptions<T>): UseInlineEditReturn<T> {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [value, setValue] = useState<T>(initialValue);

  const save = useCallback(async () => {
    if (validate && !validate(value)) {
      return;
    }

    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(value);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [value, initialValue, onSave, validate]);

  const cancel = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
    onCancel?.();
  }, [initialValue, onCancel]);

  const startEditing = useCallback(() => {
    setValue(initialValue);
    setIsEditing(true);
  }, [initialValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        save();
      } else if (e.key === "Escape") {
        cancel();
      }
    },
    [save, cancel]
  );

  return {
    isEditing,
    isSaving,
    value,
    setValue,
    save,
    cancel,
    startEditing,
    handleKeyDown,
  };
}
