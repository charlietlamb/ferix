import { env } from "@ferix/env/nextjs";
import { ConvexHttpClient } from "convex/browser";

export const convexServer = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
