import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { formatName, OgAvatar, OgLayout, OgText } from "../shared";

export const runtime = "edge";

export function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const owner = searchParams.get("owner") ?? "Unknown";
  const repo = searchParams.get("repo") ?? "Repository";

  return new ImageResponse(
    <OgLayout bgUrl={`${origin}/x/repository.png`}>
      <OgAvatar src={`https://github.com/${owner}.png`} />
      <OgText
        subtext={`${owner}/${repo}`}
        title={`${formatName(owner)} - ${formatName(repo)}`}
      />
    </OgLayout>,
    { width: 1200, height: 630 }
  );
}
