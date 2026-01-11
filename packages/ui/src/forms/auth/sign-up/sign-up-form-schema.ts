import { z } from "zod";

export const signUpFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export const signUpFormDefaults: SignUpFormValues = {
  name: "",
  email: "",
  password: "",
};
