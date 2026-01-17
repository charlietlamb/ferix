"use client";

import type { Prompt } from "@ferix/server/types";
import { DirectoryLink } from "@ferix/ui/components/directory/directory-link";
import { UserLink } from "@ferix/ui/components/user/user-link";

interface PromptCellSourceProps {
  prompt: Prompt;
}

export function PromptCellSource({ prompt }: PromptCellSourceProps) {
  if (prompt.creator) {
    return (
      <UserLink
        image={prompt.creator.image}
        name={prompt.creator.name}
        username={prompt.creator.username}
      />
    );
  }

  if (prompt.directory) {
    return (
      <DirectoryLink
        directoryId={prompt.directory._id}
        owner={prompt.directory.owner}
        repo={prompt.directory.repo}
      />
    );
  }

  return <div />;
}
