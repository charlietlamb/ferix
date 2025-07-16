import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './form-context'
import { TextField } from '../components/forms/fields/text-field'
import { SubmitButton } from '../components/forms/buttons/submit-button'

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
  },
  formComponents: {
    SubmitButton,
  },
})
