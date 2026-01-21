import { AutumnIcon } from "@ferix/ui/components/icons/autumn-icon";
import { ConvexIcon } from "@ferix/ui/components/icons/convex-icon";
import { EncoreIcon } from "@ferix/ui/components/icons/encore-icon";
import {
  SiAngular,
  SiAnthropic,
  SiApollographql,
  SiAppwrite,
  SiAstro,
  SiAuth0,
  SiBetterauth,
  SiBiome,
  SiBootstrap,
  SiBun,
  SiC,
  SiClerk,
  SiCloudflare,
  SiCockroachlabs,
  SiCplusplus,
  SiCypress,
  SiDart,
  SiDatadog,
  SiDeno,
  SiDjango,
  SiDocker,
  SiDotnet,
  SiDrizzle,
  SiElectron,
  SiElixir,
  SiEsbuild,
  SiExpo,
  SiExpress,
  SiFastapi,
  SiFauna,
  SiFigma,
  SiFirebase,
  SiFlask,
  SiGit,
  SiGithub,
  SiGitlab,
  SiGo,
  SiGraphql,
  SiHaskell,
  SiHono,
  SiJavascript,
  SiJest,
  SiKotlin,
  SiLaravel,
  SiLemonsqueezy,
  SiLinear,
  SiLua,
  SiLucia,
  SiMongodb,
  SiNeovim,
  SiNestjs,
  SiNetlify,
  SiNextdotjs,
  SiNodedotjs,
  SiNotion,
  SiNpm,
  SiNuxt,
  SiOpenai,
  SiPayloadcms,
  SiPhp,
  SiPlanetscale,
  SiPlausibleanalytics,
  SiPnpm,
  SiPocketbase,
  SiPostcss,
  SiPosthog,
  SiPrisma,
  SiPython,
  SiR,
  SiRadixui,
  SiRailway,
  SiReact,
  SiReacthookform,
  SiRedis,
  SiRemix,
  SiResend,
  SiRuby,
  SiRubyonrails,
  SiRust,
  SiSanity,
  SiSass,
  SiScala,
  SiSentry,
  SiShadcnui,
  SiSolid,
  SiSpring,
  SiStorybook,
  SiStrapi,
  SiStripe,
  SiSupabase,
  SiSvelte,
  SiSwift,
  SiTailwindcss,
  SiTauri,
  SiTrpc,
  SiTurborepo,
  SiTurso,
  SiTypescript,
  SiUmami,
  SiUpstash,
  SiVercel,
  SiVim,
  SiVite,
  SiVitest,
  SiVuedotjs,
  SiWarp,
  SiWebpack,
  SiWindsurf,
  SiYarn,
  SiZig,
  SiZod,
} from "@icons-pack/react-simple-icons";
import type { ComponentType } from "react";

export type TagCategory =
  | "language"
  | "framework"
  | "tool"
  | "database"
  | "platform"
  | "service"
  | "design"
  | "library";

export interface Tag {
  id: string;
  label: string;
  category: TagCategory;
  icon: ComponentType<{ size?: number; color?: string }>;
}

export const tags: Tag[] = [
  // Languages
  {
    id: "typescript",
    label: "TypeScript",
    category: "language",
    icon: SiTypescript,
  },
  {
    id: "javascript",
    label: "JavaScript",
    category: "language",
    icon: SiJavascript,
  },
  { id: "python", label: "Python", category: "language", icon: SiPython },
  { id: "rust", label: "Rust", category: "language", icon: SiRust },
  { id: "go", label: "Go", category: "language", icon: SiGo },
  { id: "c", label: "C", category: "language", icon: SiC },
  { id: "cpp", label: "C++", category: "language", icon: SiCplusplus },
  { id: "dotnet", label: ".NET", category: "language", icon: SiDotnet },
  { id: "ruby", label: "Ruby", category: "language", icon: SiRuby },
  { id: "php", label: "PHP", category: "language", icon: SiPhp },
  { id: "swift", label: "Swift", category: "language", icon: SiSwift },
  { id: "kotlin", label: "Kotlin", category: "language", icon: SiKotlin },
  { id: "scala", label: "Scala", category: "language", icon: SiScala },
  { id: "elixir", label: "Elixir", category: "language", icon: SiElixir },
  { id: "haskell", label: "Haskell", category: "language", icon: SiHaskell },
  { id: "lua", label: "Lua", category: "language", icon: SiLua },
  { id: "r", label: "R", category: "language", icon: SiR },
  { id: "dart", label: "Dart", category: "language", icon: SiDart },
  { id: "zig", label: "Zig", category: "language", icon: SiZig },

  // Frameworks
  { id: "react", label: "React", category: "framework", icon: SiReact },
  {
    id: "react-native",
    label: "React Native",
    category: "framework",
    icon: SiReact,
  },
  { id: "expo", label: "Expo", category: "framework", icon: SiExpo },
  { id: "nextjs", label: "Next.js", category: "framework", icon: SiNextdotjs },
  { id: "vue", label: "Vue", category: "framework", icon: SiVuedotjs },
  { id: "nuxt", label: "Nuxt", category: "framework", icon: SiNuxt },
  { id: "svelte", label: "Svelte", category: "framework", icon: SiSvelte },
  { id: "angular", label: "Angular", category: "framework", icon: SiAngular },
  { id: "solid", label: "Solid", category: "framework", icon: SiSolid },
  { id: "astro", label: "Astro", category: "framework", icon: SiAstro },
  { id: "remix", label: "Remix", category: "framework", icon: SiRemix },
  { id: "hono", label: "Hono", category: "framework", icon: SiHono },
  { id: "encore", label: "Encore", category: "framework", icon: EncoreIcon },
  { id: "express", label: "Express", category: "framework", icon: SiExpress },
  { id: "nestjs", label: "NestJS", category: "framework", icon: SiNestjs },
  { id: "trpc", label: "tRPC", category: "framework", icon: SiTrpc },
  { id: "fastapi", label: "FastAPI", category: "framework", icon: SiFastapi },
  { id: "django", label: "Django", category: "framework", icon: SiDjango },
  { id: "flask", label: "Flask", category: "framework", icon: SiFlask },
  { id: "rails", label: "Rails", category: "framework", icon: SiRubyonrails },
  { id: "spring", label: "Spring", category: "framework", icon: SiSpring },
  { id: "laravel", label: "Laravel", category: "framework", icon: SiLaravel },
  {
    id: "tailwindcss",
    label: "Tailwind CSS",
    category: "framework",
    icon: SiTailwindcss,
  },
  {
    id: "bootstrap",
    label: "Bootstrap",
    category: "framework",
    icon: SiBootstrap,
  },

  // Tools
  { id: "docker", label: "Docker", category: "tool", icon: SiDocker },
  { id: "git", label: "Git", category: "tool", icon: SiGit },
  { id: "github", label: "GitHub", category: "tool", icon: SiGithub },
  { id: "gitlab", label: "GitLab", category: "tool", icon: SiGitlab },
  { id: "vim", label: "Vim", category: "tool", icon: SiVim },
  { id: "neovim", label: "Neovim", category: "tool", icon: SiNeovim },
  { id: "nodejs", label: "Node.js", category: "tool", icon: SiNodedotjs },
  { id: "deno", label: "Deno", category: "tool", icon: SiDeno },
  { id: "bun", label: "Bun", category: "tool", icon: SiBun },
  { id: "npm", label: "npm", category: "tool", icon: SiNpm },
  { id: "pnpm", label: "pnpm", category: "tool", icon: SiPnpm },
  { id: "yarn", label: "Yarn", category: "tool", icon: SiYarn },
  { id: "turborepo", label: "Turborepo", category: "tool", icon: SiTurborepo },
  { id: "webpack", label: "Webpack", category: "tool", icon: SiWebpack },
  { id: "vite", label: "Vite", category: "tool", icon: SiVite },
  { id: "esbuild", label: "esbuild", category: "tool", icon: SiEsbuild },
  { id: "biome", label: "Biome", category: "tool", icon: SiBiome },
  { id: "vitest", label: "Vitest", category: "tool", icon: SiVitest },
  { id: "jest", label: "Jest", category: "tool", icon: SiJest },
  { id: "cypress", label: "Cypress", category: "tool", icon: SiCypress },
  { id: "storybook", label: "Storybook", category: "tool", icon: SiStorybook },
  { id: "postcss", label: "PostCSS", category: "tool", icon: SiPostcss },
  { id: "sass", label: "Sass", category: "tool", icon: SiSass },

  // Database
  { id: "prisma", label: "Prisma", category: "database", icon: SiPrisma },
  { id: "drizzle", label: "Drizzle", category: "database", icon: SiDrizzle },
  { id: "convex", label: "Convex", category: "database", icon: ConvexIcon },
  { id: "turso", label: "Turso", category: "database", icon: SiTurso },
  {
    id: "planetscale",
    label: "PlanetScale",
    category: "database",
    icon: SiPlanetscale,
  },
  { id: "upstash", label: "Upstash", category: "database", icon: SiUpstash },
  { id: "mongodb", label: "MongoDB", category: "database", icon: SiMongodb },
  { id: "redis", label: "Redis", category: "database", icon: SiRedis },
  { id: "fauna", label: "Fauna", category: "database", icon: SiFauna },
  {
    id: "cockroachdb",
    label: "CockroachDB",
    category: "database",
    icon: SiCockroachlabs,
  },
  {
    id: "pocketbase",
    label: "PocketBase",
    category: "database",
    icon: SiPocketbase,
  },
  { id: "appwrite", label: "Appwrite", category: "database", icon: SiAppwrite },

  // Platform
  { id: "vercel", label: "Vercel", category: "platform", icon: SiVercel },
  { id: "netlify", label: "Netlify", category: "platform", icon: SiNetlify },
  {
    id: "cloudflare",
    label: "Cloudflare",
    category: "platform",
    icon: SiCloudflare,
  },
  { id: "railway", label: "Railway", category: "platform", icon: SiRailway },
  { id: "supabase", label: "Supabase", category: "platform", icon: SiSupabase },
  { id: "firebase", label: "Firebase", category: "platform", icon: SiFirebase },

  // Service
  { id: "clerk", label: "Clerk", category: "service", icon: SiClerk },
  { id: "auth0", label: "Auth0", category: "service", icon: SiAuth0 },
  {
    id: "better-auth",
    label: "Better Auth",
    category: "service",
    icon: SiBetterauth,
  },
  { id: "lucia", label: "Lucia", category: "service", icon: SiLucia },
  { id: "stripe", label: "Stripe", category: "service", icon: SiStripe },
  {
    id: "lemonsqueezy",
    label: "Lemon Squeezy",
    category: "service",
    icon: SiLemonsqueezy,
  },
  { id: "resend", label: "Resend", category: "service", icon: SiResend },
  { id: "sentry", label: "Sentry", category: "service", icon: SiSentry },
  { id: "datadog", label: "Datadog", category: "service", icon: SiDatadog },
  { id: "posthog", label: "PostHog", category: "service", icon: SiPosthog },
  {
    id: "plausible",
    label: "Plausible",
    category: "service",
    icon: SiPlausibleanalytics,
  },
  { id: "umami", label: "Umami", category: "service", icon: SiUmami },
  { id: "openai", label: "OpenAI", category: "service", icon: SiOpenai },
  {
    id: "anthropic",
    label: "Anthropic",
    category: "service",
    icon: SiAnthropic,
  },
  { id: "autumn", label: "Autumn", category: "service", icon: AutumnIcon },

  // Design
  { id: "figma", label: "Figma", category: "design", icon: SiFigma },
  { id: "notion", label: "Notion", category: "design", icon: SiNotion },
  { id: "linear", label: "Linear", category: "design", icon: SiLinear },

  // Library
  { id: "shadcnui", label: "shadcn/ui", category: "library", icon: SiShadcnui },
  { id: "radixui", label: "Radix UI", category: "library", icon: SiRadixui },
  {
    id: "react-hook-form",
    label: "React Hook Form",
    category: "library",
    icon: SiReacthookform,
  },
  { id: "zod", label: "Zod", category: "library", icon: SiZod },
  { id: "graphql", label: "GraphQL", category: "library", icon: SiGraphql },
  {
    id: "apollographql",
    label: "Apollo GraphQL",
    category: "library",
    icon: SiApollographql,
  },

  // CMS
  { id: "sanity", label: "Sanity", category: "service", icon: SiSanity },
  { id: "strapi", label: "Strapi", category: "service", icon: SiStrapi },
  {
    id: "payload",
    label: "Payload CMS",
    category: "service",
    icon: SiPayloadcms,
  },

  // Desktop
  { id: "electron", label: "Electron", category: "tool", icon: SiElectron },
  { id: "tauri", label: "Tauri", category: "tool", icon: SiTauri },
  { id: "warp", label: "Warp", category: "tool", icon: SiWarp },
  { id: "windsurf", label: "Windsurf", category: "tool", icon: SiWindsurf },
];

export const tagCategories: TagCategory[] = [
  "language",
  "framework",
  "tool",
  "database",
  "platform",
  "service",
  "design",
  "library",
];

export function getTagById(id: string): Tag | undefined {
  return tags.find((tag) => tag.id === id);
}

export function getTagsByCategory(category: TagCategory): Tag[] {
  return tags.filter((tag) => tag.category === category);
}

export function getTagsByIds(ids: string[]): Tag[] {
  return ids
    .map((id) => getTagById(id))
    .filter((tag): tag is Tag => tag !== undefined);
}

export function tagsToOptions() {
  return tags.map((tag) => ({
    label: tag.label,
    value: tag.id,
    icon: tag.icon,
    group: tag.category,
  }));
}
