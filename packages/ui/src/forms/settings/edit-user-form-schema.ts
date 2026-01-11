import { z } from "zod";

export const editUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
