"use client";

import { Link } from "@ferix/i18n/navigation";
import type { DialogKey } from "@ferix/ui/store/dialog";

export interface AdminItemProps {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: string;
  href?: string;
  dialog?: DialogKey;
  onAction?: (dialog: DialogKey) => void;
}

export function AdminItem({
  href,
  dialog,
  onAction,
  icon: Icon,
  title,
  description,
}: AdminItemProps) {
  const className =
    "group flex h-full w-full gap-2 p-4 text-left transition-colors hover:bg-muted/50";

  const content = (
    <>
      <Icon className="mt-0.5 shrink-0 text-muted-foreground" size={20} />
      <div className="min-w-0 flex-1">
        <div className="text-sm">{title}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={className}
      onClick={() => dialog && onAction?.(dialog)}
      type="button"
    >
      {content}
    </button>
  );
}
