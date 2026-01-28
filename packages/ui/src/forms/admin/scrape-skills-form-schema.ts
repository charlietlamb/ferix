import { z } from "zod";

export const scrapeSkillsFormSchema = z.object({
  limit: z.string(),
  tags: z.array(z.string()),
});

export type ScrapeSkillsFormValues = z.infer<typeof scrapeSkillsFormSchema>;

export const scrapeSkillsFormDefaults: ScrapeSkillsFormValues = {
  limit: "",
  tags: [],
};
