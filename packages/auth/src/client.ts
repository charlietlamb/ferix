"use client";

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { env } from "@ferix/env/nextjs";
import type { User } from "better-auth";
import {
  adminClient,
  deviceAuthorizationClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [
    convexClient(),
    usernameClient(),
    adminClient(),
    deviceAuthorizationClient(),
  ],
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
  admin,
} = authClient;

/**
 * User type extended with username and admin plugin fields
 * Note: banExpires can be Date (from session) or number (from storage)
 */
export type UserWithUsername = User & {
  username?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | number | null;
};
