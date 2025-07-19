import { Button } from '@ferix/ui/components/shadcn/button';
import { Spinner } from '@ferix/ui/components/utility/loading/spinner';
import { useFormContext } from '@ferix/ui/hooks/form-context';
import { cn } from '@ferix/ui/lib/utils';

export function SubmitButton({ label }: { label: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          className={cn(isSubmitting && 'cursor-default')}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? <Spinner /> : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
