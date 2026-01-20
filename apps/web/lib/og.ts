import { env } from "@ferix/env/nextjs";
import type { Metadata } from "next";

interface OgMetadataOptions {
  title: string;
  description: string;
  ogPath: string;
  params?: Record<string, string>;
  canonicalPath?: string;
}

export function buildOgMetadata({
  title,
  description,
  ogPath,
  params = {},
  canonicalPath,
}: OgMetadataOptions): Metadata {
  const ogImageUrl = new URL(ogPath, env.NEXT_PUBLIC_SITE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      ogImageUrl.searchParams.set(key, value);
    }
  }

  return {
    title,
    description,
    ...(canonicalPath && {
      alternates: {
        canonical: canonicalPath,
      },
    }),
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl.toString()],
    },
  };
}
