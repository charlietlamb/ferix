import { toast } from "sonner";

interface MutationOptions {
  successMessage?: string;
  errorMessage: string;
}

/**
 * Wraps a mutation call with standardized error handling and toast notifications.
 *
 * @example
 * const result = await handleMutation(
 *   () => updateTags({ promptId, tags: newTags }),
 *   { errorMessage: t("tagsError"), successMessage: t("tagsSuccess") }
 * );
 */
export async function handleMutation<T>(
  mutation: () => Promise<T>,
  options: MutationOptions
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await mutation();
    if (options.successMessage) {
      toast.success(options.successMessage);
    }
    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    toast.error(options.errorMessage);
    return { data: null, error };
  }
}

/**
 * Wraps a mutation with optimistic updates and automatic rollback on error.
 *
 * @example
 * await handleOptimisticMutation({
 *   mutation: () => updateTags({ promptId, tags: newTags }),
 *   optimisticUpdate: () => setOptimistic(newTags),
 *   rollback: () => reset(),
 *   errorMessage: t("tagsError"),
 * });
 */
export async function handleOptimisticMutation<T>(options: {
  mutation: () => Promise<T>;
  optimisticUpdate: () => void;
  rollback: () => void;
  successMessage?: string;
  errorMessage: string;
}): Promise<{ data: T | null; error: Error | null }> {
  options.optimisticUpdate();

  try {
    const data = await options.mutation();
    if (options.successMessage) {
      toast.success(options.successMessage);
    }
    return { data, error: null };
  } catch (err) {
    options.rollback();
    const error = err instanceof Error ? err : new Error("Unknown error");
    toast.error(options.errorMessage);
    return { data: null, error };
  }
}
