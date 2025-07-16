import { useFormContext } from '@ferix/ui/hooks/form-context'
import { Button } from '@ferix/ui/components/shadcn/button'
import { cn } from '@ferix/ui/lib/utils'
import { Spinner } from '@ferix/ui/components/utility/loading/spinner'

export function SubmitButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className={cn(isSubmitting && 'cursor-default')}
        >
          {isSubmitting ? <Spinner /> : label}
        </Button>
      )}
    </form.Subscribe>
  )
}
