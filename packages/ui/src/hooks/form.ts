import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './form-context'
import { TextField } from '../components/forms/fields/text-field'

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
  },
  formComponents: {},
})
