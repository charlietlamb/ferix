"use client";

import { useCallback, useRef, useState } from "react";

interface UseAutoSubmitFormOptions<TValue> {
  /** Initial/server value */
  initialValue: TValue;
  /** Called when value changes - should perform the mutation */
  onSubmit: (value: TValue) => Promise<void>;
  /** Compare function for values (default: JSON stringify comparison) */
  isEqual?: (a: TValue, b: TValue) => boolean;
  /** Debounce delay in ms (default: 0, immediate) */
  debounceMs?: number;
}

interface UseAutoSubmitFormReturn<TValue> {
  /** Current optimistic value */
  value: TValue;
  /** Update value and trigger auto-submit */
  setValue: (value: TValue) => void;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Reset to server value (e.g., on cancel) */
  reset: () => void;
}

const defaultIsEqual = <T>(a: T, b: T): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Hook for auto-submitting on value changes with optimistic updates and rollback.
 * Provides a TanStack Form-like interface for inline editing scenarios.
 *
 * @example
 * const { value, setValue, isSubmitting } = useAutoSubmitForm({
 *   initialValue: tags,
 *   onSubmit: async (newTags) => {
 *     await updateTags({ promptId, tags: newTags });
 *   },
 * });
 *
 * // On tag change
 * setValue(newTags); // Immediately optimistic, auto-submits
 */
export function useAutoSubmitForm<TValue>({
  initialValue,
  onSubmit,
  isEqual = defaultIsEqual,
  debounceMs = 0,
}: UseAutoSubmitFormOptions<TValue>): UseAutoSubmitFormReturn<TValue> {
  const [optimisticValue, setOptimisticValue] = useState<TValue>(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const serverValueRef = useRef<TValue>(initialValue);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<TValue | null>(null);

  // Sync with server value changes (e.g., from props update after mutation)
  if (!isEqual(serverValueRef.current, initialValue)) {
    serverValueRef.current = initialValue;
    // Only sync optimistic value if not currently submitting
    if (!isSubmitting && pendingValueRef.current === null) {
      setOptimisticValue(initialValue);
    }
  }

  const submitValue = useCallback(
    async (newValue: TValue) => {
      // Skip if value matches server
      if (isEqual(newValue, serverValueRef.current)) {
        return;
      }

      setIsSubmitting(true);
      pendingValueRef.current = newValue;

      try {
        await onSubmit(newValue);
        serverValueRef.current = newValue;
      } catch {
        // Rollback on error
        setOptimisticValue(serverValueRef.current);
      } finally {
        pendingValueRef.current = null;
        setIsSubmitting(false);
      }
    },
    [onSubmit, isEqual]
  );

  const setValue = useCallback(
    (newValue: TValue) => {
      // Set optimistic value immediately
      setOptimisticValue(newValue);

      // Clear existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // Schedule or immediate submit
      if (debounceMs > 0) {
        debounceTimeoutRef.current = setTimeout(() => {
          submitValue(newValue);
        }, debounceMs);
      } else {
        submitValue(newValue);
      }
    },
    [debounceMs, submitValue]
  );

  const reset = useCallback(() => {
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    setOptimisticValue(serverValueRef.current);
  }, []);

  return {
    value: optimisticValue,
    setValue,
    isSubmitting,
    reset,
  };
}
