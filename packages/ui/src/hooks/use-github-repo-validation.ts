"use client";

import { api } from "@ferix/server/_generated/api";
import { parseGithubUrl } from "@ferix/ui/forms/repositories/add-repository-form-schema";
import { useAction, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

export type GithubRepoStatus =
  | "idle"
  | "checking"
  | "valid"
  | "invalid"
  | "conflict"
  | "error";

export interface GithubRepoData {
  fullName: string;
  description: string | null;
  avatarUrl: string;
  stars: number;
  htmlUrl: string;
}

interface UseGithubRepoValidationResult {
  status: GithubRepoStatus;
  repoData: GithubRepoData | null;
  error: string | null;
  setUrl: (url: string) => void;
  reset: () => void;
}

const trailingSlashRegex = /\/$/;

export function useGithubRepoValidation(): UseGithubRepoValidationResult {
  const [url, setUrl] = useState<string>("");
  const [debouncedUrl] = useDebounce(url, 500);
  const [status, setStatus] = useState<GithubRepoStatus>("idle");
  const [repoData, setRepoData] = useState<GithubRepoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const validateRepo = useAction(api.directories.validateGithubRepo);

  // Normalize URL for database lookup (remove trailing slash)
  const normalizedUrl = debouncedUrl.replace(trailingSlashRegex, "");
  const existingDirectory = useQuery(
    api.directories.getByGithubUrl,
    normalizedUrl ? { githubUrl: normalizedUrl } : "skip"
  );

  const reset = useCallback(() => {
    setUrl("");
    setStatus("idle");
    setRepoData(null);
    setError(null);
  }, []);

  useEffect(() => {
    // Reset if URL is empty
    if (!debouncedUrl) {
      setStatus("idle");
      setRepoData(null);
      setError(null);
      return;
    }

    // Parse the URL
    const parsed = parseGithubUrl(debouncedUrl);
    if (!parsed) {
      setStatus("invalid");
      setRepoData(null);
      setError("Invalid GitHub URL format");
      return;
    }

    // If we're still debouncing, show checking
    if (debouncedUrl !== url) {
      setStatus("checking");
      return;
    }

    const { owner, repo } = parsed;
    abortRef.current = false;

    async function fetchRepo() {
      setStatus("checking");
      setError(null);

      try {
        const data = await validateRepo({ owner, repo });

        if (abortRef.current) {
          return;
        }

        setRepoData(data);
        setStatus("valid");
        setError(null);
      } catch (err) {
        if (abortRef.current) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Failed to fetch repository";

        if (message.includes("not found") || message.includes("private")) {
          setStatus("invalid");
          setError("Repository not found or is private");
        } else {
          setStatus("error");
          setError(message);
        }
        setRepoData(null);
      }
    }

    fetchRepo();

    return () => {
      abortRef.current = true;
    };
  }, [debouncedUrl, url, validateRepo]);

  // Show checking while debouncing
  let effectiveStatus: GithubRepoStatus =
    url && debouncedUrl !== url ? "checking" : status;
  let effectiveError = error;

  // Check for conflict after GitHub validation passes
  if (effectiveStatus === "valid" && existingDirectory) {
    effectiveStatus = "conflict";
    effectiveError = "This repository has already been added";
  }

  return {
    status: effectiveStatus,
    repoData,
    error: effectiveError,
    setUrl,
    reset,
  };
}
