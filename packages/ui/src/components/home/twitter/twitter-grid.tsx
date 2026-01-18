"use client";

import { getGridItemBorderClasses } from "@ferix/ui/lib/repositories";
import { TweetCard } from "./tweet-card";
import { TWEETS } from "./twitter-data";
import { TwitterGridHeader } from "./twitter-grid-header";

export function TwitterGrid() {
  return (
    <section className="flex flex-col border-border border-b">
      <TwitterGridHeader />
      <div>
        <ul className="grid grid-cols-1 md:grid-cols-3">
          {TWEETS.map((tweet, i) => (
            <li
              className={getGridItemBorderClasses(i, TWEETS.length, {
                colsMobile: 1,
                colsDesktop: 3,
              })}
              key={tweet.id}
            >
              <TweetCard tweet={tweet} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
