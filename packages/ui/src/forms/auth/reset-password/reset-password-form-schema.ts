import { z } from "zod";
import { passwordSchema } from "../../schemas/password";

export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export const resetPasswordFormDefaults: ResetPasswordFormValues = {
  password: "",
  confirmPassword: "",
};
