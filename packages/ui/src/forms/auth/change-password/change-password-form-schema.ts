import { z } from "zod";
import { existingPasswordSchema, passwordSchema } from "../../schemas/password";

export const changePasswordFormSchema = z
  .object({
    currentPassword: existingPasswordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export const changePasswordFormDefaults: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};
