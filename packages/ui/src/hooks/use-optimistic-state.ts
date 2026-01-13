"use client";

import { useCallback, useState } from "react";

/**
 * Hook for managing optimistic UI updates.
 * Returns the optimistic value if set, otherwise falls back to the server value.
 *
 * @example
 * const { current: isSaved, setOptimistic, reset } = useOptimisticState(serverIsSaved);
 * // On action: setOptimistic(!isSaved);
 * // On error: reset();
 */
export function useOptimisticState<T>(serverValue: T) {
  const [optimistic, setOptimistic] = useState<T | null>(null);

  const current = optimistic ?? serverValue;

  const reset = useCallback(() => setOptimistic(null), []);

  return { current, setOptimistic, reset };
}
