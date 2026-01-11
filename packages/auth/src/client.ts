"use client";

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { env } from "@ferix/env/nextjs";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [convexClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  updateUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
} = authClient;
