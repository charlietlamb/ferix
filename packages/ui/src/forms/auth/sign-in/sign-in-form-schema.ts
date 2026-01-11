import { z } from "zod";

export const signInFormSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;

export const signInFormDefaults: SignInFormValues = {
  email: "",
  password: "",
};
