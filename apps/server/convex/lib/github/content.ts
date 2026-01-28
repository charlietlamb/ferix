// GitHub file content fetching

export interface MarkdownFile {
  path: string;
  title: string;
  content: string;
}

/**
 * Fetch raw file content from GitHub
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.statusText}`);
  }

  return response.text();
}
