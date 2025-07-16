import { useFormContext } from '@ferix/ui/hooks/form-context'
import { AnyFormApi } from '@tanstack/react-form'

export function FormWrapper({
  form,
  heading,
  subheading,
  children,
}: {
  form: AnyFormApi
  heading: string
  subheading: string
  children: React.ReactNode
}) {
  return (
    <form
      className="flex flex-col gap-4 w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <div>
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-muted-foreground">{subheading}</p>
      </div>
      {children}
    </form>
  )
}
