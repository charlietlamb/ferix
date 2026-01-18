import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { formatName, OgAvatar, OgLayout, OgText } from "../shared";

export const runtime = "edge";

function getDisplayName(name: string | null, owner: string): string {
  const trimmedName = name?.trim();
  return trimmedName && trimmedName.length > 0
    ? trimmedName
    : formatName(owner);
}

export function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const owner = searchParams.get("owner") ?? "Unknown";
  const repo = searchParams.get("repo") ?? "Repository";
  const name = searchParams.get("name");

  const displayName = getDisplayName(name, owner);

  return new ImageResponse(
    <OgLayout bgUrl={`${origin}/x/repository.png`}>
      <OgAvatar src={`https://github.com/${owner}.png`} />
      <OgText subtext={`${owner}/${repo}`} title={displayName} />
    </OgLayout>,
    { width: 1200, height: 630 }
  );
}
