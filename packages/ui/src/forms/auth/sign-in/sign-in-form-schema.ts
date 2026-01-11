import { z } from "zod";
import { existingPasswordSchema } from "../../schemas/password";

export const signInFormSchema = z.object({
  email: z.email("Invalid email address"),
  password: existingPasswordSchema,
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;

export const signInFormDefaults: SignInFormValues = {
  email: "",
  password: "",
};
