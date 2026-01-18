import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { formatName, OgAvatar, OgLayout, OgText } from "../shared";

export const runtime = "edge";

function getSubtext(owner: string, repo: string, username: string): string {
  if (owner && repo) {
    return `${owner}/${repo}`;
  }
  if (username) {
    return `@${username}`;
  }
  return "";
}

export function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const title = searchParams.get("title") ?? "Prompt";
  const owner = searchParams.get("owner") ?? "";
  const repo = searchParams.get("repo") ?? "";
  const username = searchParams.get("username") ?? "";
  const image = searchParams.get("image") ?? "";

  let avatarUrl: string | null = null;
  if (owner) {
    avatarUrl = `https://github.com/${owner}.png`;
  } else if (image) {
    avatarUrl = image;
  } else if (username) {
    avatarUrl = `https://github.com/${username}.png`;
  }

  return new ImageResponse(
    <OgLayout bgUrl={`${origin}/x/repository.png`}>
      {avatarUrl && <OgAvatar src={avatarUrl} />}
      <OgText
        subtext={getSubtext(owner, repo, username)}
        title={formatName(title)}
      />
    </OgLayout>,
    { width: 1200, height: 630 }
  );
}
