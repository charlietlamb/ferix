"use client";

import { PromptDetailSection } from "@ferix/ui/components/prompts/prompt-detail-section";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import { useTranslations } from "next-intl";

interface PromptDetailAuthorProps {
  creator: { name: string; image: string | null } | null;
}

export function PromptDetailAuthor({ creator }: PromptDetailAuthorProps) {
  const t = useTranslations("promptDetail");

  return (
    <PromptDetailSection title={t("author")}>
      {creator ? (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            {creator.image && (
              <AvatarImage alt={creator.name} src={creator.image} />
            )}
            <AvatarFallback>
              {creator.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{creator.name}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">
          {t("unknownAuthor")}
        </span>
      )}
    </PromptDetailSection>
  );
}
