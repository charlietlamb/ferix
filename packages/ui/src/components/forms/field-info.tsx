import { AnyFieldApi } from '@tanstack/react-form'

export function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em className="text-xs text-destructive">
          {field.state.meta.errors.join(', ')}
        </em>
      ) : null}
    </>
  )
}
