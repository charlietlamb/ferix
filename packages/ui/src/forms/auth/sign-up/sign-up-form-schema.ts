import { z } from "zod";
import { passwordSchema } from "../../schemas/password";

export const signUpFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: passwordSchema,
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export const signUpFormDefaults: SignUpFormValues = {
  name: "",
  email: "",
  password: "",
};
