import { useFieldContext } from '@ferix/ui/hooks/form-context'
import { Label } from '@ferix/ui/components/shadcn/label'
import { Input } from '@ferix/ui/components/shadcn/input'

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
      <Input
        placeholder={placeholder}
        type={type}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      <p
        className="text-muted-foreground mt-2 text-xs"
        role="region"
        aria-live="polite"
      >
        {textAfter}
      </p>
    </div>
  )
}
