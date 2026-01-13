"use client";

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { env } from "@ferix/env/nextjs";
import type { User } from "better-auth";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [convexClient(), usernameClient()],
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

/**
 * User type extended with username plugin fields
 */
export type UserWithUsername = User & {
  username?: string | null;
};
