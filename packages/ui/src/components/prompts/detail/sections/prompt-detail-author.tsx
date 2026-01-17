"use client";

import { DirectoryLink } from "@ferix/ui/components/directory/directory-link";
import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { UserLink } from "@ferix/ui/components/user/user-link";
import { useTranslations } from "next-intl";

interface PromptDetailAuthorProps {
  creator: {
    name: string;
    image: string | null;
    username: string | null;
  } | null;
  directory: {
    _id: string;
    owner: string;
    repo: string;
  } | null;
}

export function PromptDetailAuthor({
  creator,
  directory,
}: PromptDetailAuthorProps) {
  const t = useTranslations("promptDetail");

  // Show directory if no creator but has directory
  if (!creator && directory) {
    return (
      <PromptSection title={t("directory")}>
        <DirectoryLink
          directoryId={directory._id}
          owner={directory.owner}
          repo={directory.repo}
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
