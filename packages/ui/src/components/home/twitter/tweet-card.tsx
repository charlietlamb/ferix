import { XLogoIcon } from "@phosphor-icons/react";
import type { Tweet } from "./twitter-data";

interface TweetCardProps {
  tweet: Tweet;
}

export function TweetCard({ tweet }: TweetCardProps) {
  return (
    <a
      className="group flex h-full flex-col gap-3 p-4 transition-colors hover:bg-muted/50"
      href={tweet.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <img
            alt={tweet.displayName}
            className="size-10 rounded-full"
            height={40}
            src={`https://unavatar.io/twitter/${tweet.username}`}
            width={40}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">
              {tweet.displayName}
            </span>
            <span className="text-muted-foreground text-sm">
              @{tweet.username}
            </span>
          </div>
        </div>
        <XLogoIcon className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
      <p className="text-foreground text-sm leading-normal">{tweet.content}</p>
    </a>
  );
}
