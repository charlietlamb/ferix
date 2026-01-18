"use client";

import type { Prompt } from "@ferix/server/types";
import { RepositoryLink } from "@ferix/ui/components/repository/repository-link";
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
      <RepositoryLink
        owner={prompt.directory.owner}
        repo={prompt.directory.repo}
        repositoryId={prompt.directory._id}
      />
    );
  }

  return <div />;
}
