"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import { getDirectoryById } from "@ferix/ui/lib/directories";
import { cn } from "@ferix/ui/lib/utils";

interface DirectoryAvatarProps {
  directoryId: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  user?: {
    name: string;
    image?: string | null;
  };
}

const sizeClasses = {
  sm: "size-6",
  default: "size-8",
  lg: "size-10",
};

const imageSizes = {
  sm: 24,
  default: 32,
  lg: 40,
};

const badgeSizeClasses = {
  sm: "size-3.5",
  default: "size-4",
  lg: "size-5",
};

const fallbackTextSizes = {
  sm: "text-[6px]",
  default: "text-[8px]",
  lg: "text-[10px]",
};

export function DirectoryAvatar({
  directoryId,
  size = "default",
  className,
  user,
}: DirectoryAvatarProps) {
  const directory = getDirectoryById(directoryId);
  if (!directory) {
    return null;
  }

  return (
    <div className={cn("relative shrink-0", sizeClasses[size], className)}>
      {/* biome-ignore lint: public svg */}
      <img
        alt={directory.name}
        className="absolute inset-0 size-full object-contain dark:hidden"
        height={imageSizes[size]}
        src={directory.lightImageUrl}
        width={imageSizes[size]}
      />
      {/* biome-ignore lint: public svg */}
      <img
        alt={directory.name}
        className="absolute inset-0 hidden size-full object-contain dark:block"
        height={imageSizes[size]}
        src={directory.darkImageUrl}
        width={imageSizes[size]}
      />
      {user && (
        <div
          className={cn(
            "absolute -right-0.5 -bottom-0.5 z-10 rounded-full ring-2 ring-background",
            badgeSizeClasses[size]
          )}
        >
          <Avatar className="size-full">
            {user.image && <AvatarImage alt={user.name} src={user.image} />}
            <AvatarFallback className={fallbackTextSizes[size]}>
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}
