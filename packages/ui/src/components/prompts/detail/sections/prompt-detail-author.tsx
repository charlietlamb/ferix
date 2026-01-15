"use client";

import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { UserLink } from "@ferix/ui/components/user/user-link";
import { useTranslations } from "next-intl";

interface PromptDetailAuthorProps {
  creator: {
    name: string;
    image: string | null;
    username: string | null;
  } | null;
  directoryId?: string;
}

export function PromptDetailAuthor({
  creator,
  directoryId,
}: PromptDetailAuthorProps) {
  const t = useTranslations("promptDetail");

  return (
    <PromptSection title={t("author")}>
      {creator ? (
        <UserLink
          directoryId={directoryId}
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
