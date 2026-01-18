"use client";

import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { RepositoryLink } from "@ferix/ui/components/repository/repository-link";
import { UserLink } from "@ferix/ui/components/user/user-link";
import { useTranslations } from "next-intl";

interface PromptDetailAuthorProps {
  creator: {
    name: string;
    image: string | null;
    username: string | null;
  } | null;
  repository: {
    _id: string;
    owner: string;
    repo: string;
  } | null;
}

export function PromptDetailAuthor({
  creator,
  repository,
}: PromptDetailAuthorProps) {
  const t = useTranslations("promptDetail");

  // Show repository if no creator but has repository
  if (!creator && repository) {
    return (
      <PromptSection title={t("repository")}>
        <RepositoryLink
          owner={repository.owner}
          repo={repository.repo}
          repositoryId={repository._id}
        />
      </PromptSection>
    );
  }

  return (
    <PromptSection title={t("author")}>
      {creator ? (
        <UserLink
          image={creator.image}
          name={creator.name}
          username={creator.username}
        />
      ) : (
        <span className="text-muted-foreground text-sm">
          {t("unknownAuthor")}
        </span>
      )}
    </PromptSection>
  );
}
