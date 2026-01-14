"use client";

import { useRouter } from "@ferix/i18n/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import { cn } from "@ferix/ui/lib/utils";

interface UserLinkProps {
  name: string;
  username: string | null;
  image?: string | null;
  className?: string;
  showAvatar?: boolean;
  avatarSize?: "sm" | "default" | "lg";
}

export function UserLink({
  name,
  username,
  image,
  className,
  showAvatar = true,
  avatarSize = "sm",
}: UserLinkProps) {
  const router = useRouter();

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatar && (
        <Avatar size={avatarSize}>
          {image && <AvatarImage alt={name} src={image} />}
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="max-w-20 truncate text-foreground text-xs">
          {name}
        </span>
        {username && (
          <span className="max-w-20 truncate text-muted-foreground text-xs">
            {username}
          </span>
        )}
      </div>
    </div>
  );

  if (username) {
    return (
      <button
        className="transition-opacity hover:opacity-80"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/user/${username}`);
        }}
        type="button"
      >
        {content}
      </button>
    );
  }

  return content;
}
