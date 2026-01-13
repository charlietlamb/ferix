"use client";

import { api } from "@ferix/server/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useDebounce } from "use-debounce";

type UsernameStatus = "idle" | "checking" | "available" | "taken";

export function useUsernameAvailability(currentUsername?: string | null) {
  const [username, setUsername] = useState<string | null>(null);
  const [debouncedUsername] = useDebounce(username, 500);

  const result = useQuery(
    api.users.isUsernameAvailable,
    debouncedUsername && debouncedUsername !== currentUsername
      ? { username: debouncedUsername }
      : "skip"
  );

  function getStatus(): UsernameStatus {
    if (
      username === null ||
      username === currentUsername ||
      username.length < 3
    ) {
      return "idle";
    }
    if (debouncedUsername !== username || result === undefined) {
      return "checking";
    }
    if (result.available) {
      return "available";
    }
    return "taken";
  }

  const status = getStatus();

  return { status, setUsername, reset: () => setUsername(null) };
}
