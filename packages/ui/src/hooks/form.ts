import { SubmitButton } from '@ferix/ui/components/forms/buttons/submit-button';
import { SelectField } from '@ferix/ui/components/forms/fields/select-field';
import { TextField } from '@ferix/ui/components/forms/fields/text-field';
import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from './form-context';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    SelectField,
  },
  formComponents: {
    SubmitButton,
  },
});
