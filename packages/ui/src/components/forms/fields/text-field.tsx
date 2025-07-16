import { useFieldContext } from '@ferix/ui/hooks/form-context'
import { Label } from '@ferix/ui/components/shadcn/label'
import { Input } from '@ferix/ui/components/shadcn/input'
import { FieldInfo } from '@ferix/ui/components/forms/field-info'
import { Spinner } from '@ferix/ui/components/utility/loading/spinner'

export function TextField({
  label,
  type,
  placeholder,
  textAfter,
}: {
  label: string
  type: HTMLInputElement['type']
  placeholder?: string
  textAfter?: string
}) {
  const field = useFieldContext<string>()
  return (
    <div className="*:not-first:mt-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          type={type}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
        />
        {field.state.meta.isValidating && (
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50">
            <Spinner className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>
      {textAfter && (
        <p
          className="text-muted-foreground mt-2 text-xs"
          role="region"
          aria-live="polite"
        >
          {textAfter}
        </p>
      )}
      <FieldInfo field={field} />
    </div>
  )
}
