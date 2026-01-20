import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ferix - AI Agent Skills & Prompts",
    short_name: "Ferix",
    description:
      "Discover and share skills, subagents, and rules for AI agents like Claude, Cursor, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#020710",
    theme_color: "#E3E8F0",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
