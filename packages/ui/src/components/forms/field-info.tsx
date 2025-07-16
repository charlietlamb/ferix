import { AnyFieldApi } from '@tanstack/react-form'
import { useTranslations } from 'next-intl'

export function FieldInfo({ field }: { field: AnyFieldApi }) {
  const t = useTranslations('form.fieldInfo')
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.join(', ')}</em>
      ) : null}
      {field.state.meta.isValidating ? t('validating') : null}
    </>
  )
}
