import {
  SiAngular,
  SiAnthropic,
  SiApollographql,
  SiAstro,
  SiAuth0,
  SiBiome,
  SiBootstrap,
  SiBun,
  SiC,
  SiClerk,
  SiCloudflare,
  SiCplusplus,
  SiCypress,
  SiDart,
  SiDatadog,
  SiDeno,
  SiDjango,
  SiDocker,
  SiDotnet,
  SiDrizzle,
  SiElixir,
  SiEsbuild,
  SiExpress,
  SiFastapi,
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
  SiLinear,
  SiLua,
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
  SiPhp,
  SiPnpm,
  SiPostcss,
  SiPrisma,
  SiPython,
  SiR,
  SiRadixui,
  SiRailway,
  SiReact,
  SiRedis,
  SiRemix,
  SiRuby,
  SiRubyonrails,
  SiRust,
  SiSass,
  SiScala,
  SiSentry,
  SiSolid,
  SiSpring,
  SiStorybook,
  SiStripe,
  SiSupabase,
  SiSvelte,
  SiSwift,
  SiTailwindcss,
  SiTrpc,
  SiTurborepo,
  SiTypescript,
  SiVercel,
  SiVim,
  SiVite,
  SiVitest,
  SiVuedotjs,
  SiWebpack,
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
  { id: "nextjs", label: "Next.js", category: "framework", icon: SiNextdotjs },
  { id: "vue", label: "Vue", category: "framework", icon: SiVuedotjs },
  { id: "nuxt", label: "Nuxt", category: "framework", icon: SiNuxt },
  { id: "svelte", label: "Svelte", category: "framework", icon: SiSvelte },
  { id: "angular", label: "Angular", category: "framework", icon: SiAngular },
  { id: "solid", label: "Solid", category: "framework", icon: SiSolid },
  { id: "astro", label: "Astro", category: "framework", icon: SiAstro },
  { id: "remix", label: "Remix", category: "framework", icon: SiRemix },
  { id: "hono", label: "Hono", category: "framework", icon: SiHono },
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
  { id: "mongodb", label: "MongoDB", category: "database", icon: SiMongodb },
  { id: "redis", label: "Redis", category: "database", icon: SiRedis },

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
  { id: "stripe", label: "Stripe", category: "service", icon: SiStripe },
  { id: "sentry", label: "Sentry", category: "service", icon: SiSentry },
  { id: "datadog", label: "Datadog", category: "service", icon: SiDatadog },
  { id: "openai", label: "OpenAI", category: "service", icon: SiOpenai },
  {
    id: "anthropic",
    label: "Anthropic",
    category: "service",
    icon: SiAnthropic,
  },

  // Design
  { id: "figma", label: "Figma", category: "design", icon: SiFigma },
  { id: "notion", label: "Notion", category: "design", icon: SiNotion },
  { id: "linear", label: "Linear", category: "design", icon: SiLinear },

  // Library
  { id: "radixui", label: "Radix UI", category: "library", icon: SiRadixui },
  { id: "zod", label: "Zod", category: "library", icon: SiZod },
  { id: "graphql", label: "GraphQL", category: "library", icon: SiGraphql },
  {
    id: "apollographql",
    label: "Apollo GraphQL",
    category: "library",
    icon: SiApollographql,
  },
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
