import { FieldInfo } from '@ferix/ui/components/forms/field-info';
import { Input } from '@ferix/ui/components/shadcn/input';
import { Label } from '@ferix/ui/components/shadcn/label';
import { Spinner } from '@ferix/ui/components/utility/loading/spinner';
import { useFieldContext } from '@ferix/ui/hooks/form-context';

export function TextField({
  label,
  type,
  placeholder,
  textAfter,
}: {
  label: string;
  type: HTMLInputElement['type'];
  placeholder?: string;
  textAfter?: string;
}) {
  const field = useFieldContext<string>();
  return (
    <div className="*:not-first:mt-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          value={field.state.value}
        />
        {field.state.meta.isValidating && (
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <Spinner aria-hidden="true" className="size-4" />
          </div>
        )}
      </div>
      {textAfter && (
        <section
          aria-live="polite"
          className="mt-2 text-muted-foreground text-xs"
        >
          {textAfter}
        </section>
      )}
      <FieldInfo field={field} />
    </div>
  );
}
