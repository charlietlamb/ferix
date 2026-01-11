import { PasswordField } from "@ferix/ui/components/form/password-field";
import { SubmitButton } from "@ferix/ui/components/form/submit-button";
import { TextAreaField } from "@ferix/ui/components/form/text-area-field";
import { TextField } from "@ferix/ui/components/form/text-field";
import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./form-context";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    PasswordField,
    TextAreaField,
    TextField,
  },
  formComponents: {
    SubmitButton,
  },
});
