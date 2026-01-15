"use client";

import { DirectoryAvatar } from "@ferix/ui/components/directory/directory-avatar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import { useTranslations } from "next-intl";

interface PromptDetailAuthorProps {
  creator: { name: string; image: string | null } | null;
  directoryId?: string | null;
}

export function PromptDetailAuthor({
  creator,
  directoryId,
}: PromptDetailAuthorProps) {
  const t = useTranslations("promptDetail");

  return (
    <div className="flex flex-col gap-2 border-border border-b p-4">
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("author")}
      </h3>
      {creator ? (
        <div className="flex items-center gap-2">
          {directoryId ? (
            <DirectoryAvatar
              directoryId={directoryId}
              size="sm"
              user={{ name: creator.name, image: creator.image }}
            />
          ) : (
            <Avatar size="sm">
              {creator.image && (
                <AvatarImage alt={creator.name} src={creator.image} />
              )}
              <AvatarFallback>
                {creator.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-sm">{creator.name}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">
          {t("unknownAuthor")}
        </span>
      )}
    </div>
  );
}
