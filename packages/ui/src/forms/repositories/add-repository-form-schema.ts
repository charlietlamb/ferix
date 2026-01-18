import { z } from "zod";

const githubUrlRegex = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/?$/;

export const addRepositoryFormSchema = z.object({
  githubUrl: z
    .string()
    .min(1, "GitHub URL is required")
    .regex(githubUrlRegex, "Must be a valid GitHub repository URL"),
  name: z.string().max(32, "Name must be 32 characters or less").optional(),
  tags: z.array(z.string()),
});

export type AddRepositoryFormValues = z.infer<typeof addRepositoryFormSchema>;

export const addRepositoryFormDefaults: AddRepositoryFormValues = {
  githubUrl: "",
  name: "",
  tags: [],
};

/**
 * Parse owner and repo from a GitHub URL
 * @param url - GitHub repository URL (e.g., "https://github.com/owner/repo")
 * @returns { owner, repo } or null if invalid
 */
export function parseGithubUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(githubUrlRegex);
  if (!match) {
    return null;
  }
  const owner = match[1];
  const repo = match[2];
  if (!(owner && repo)) {
    return null;
  }
  return { owner, repo };
}
