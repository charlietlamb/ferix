// GitHub API HTTP client utilities - rate limiting, headers, and error handling

import { env } from "@ferix/env/convex";

// Rate limit configuration: reserve 20% for production usage
// Pause when remaining API calls drops below this threshold
const RATE_LIMIT_THRESHOLD = 100;

export interface RateLimitInfo {
  remaining: number;
  reset: number; // Unix timestamp in seconds
  limit: number;
}

export class RateLimitError extends Error {
  resetAt: number;

  constructor(resetAt: number) {
    super(
      `GitHub API rate limit exceeded. Resets at ${new Date(resetAt * 1000).toISOString()}`
    );
    this.name = "RateLimitError";
    this.resetAt = resetAt;
  }
}

export function parseRateLimitHeaders(response: Response): RateLimitInfo {
  return {
    remaining: Number.parseInt(
      response.headers.get("X-RateLimit-Remaining") ?? "5000",
      10
    ),
    reset: Number.parseInt(
      response.headers.get("X-RateLimit-Reset") ??
        String(Math.floor(Date.now() / 1000) + 3600),
      10
    ),
    limit: Number.parseInt(
      response.headers.get("X-RateLimit-Limit") ?? "5000",
      10
    ),
  };
}

export function checkRateLimit(response: Response): void {
  const rateLimit = parseRateLimitHeaders(response);

  if (response.status === 403 || response.status === 429) {
    throw new RateLimitError(rateLimit.reset);
  }

  if (rateLimit.remaining < RATE_LIMIT_THRESHOLD) {
    throw new RateLimitError(rateLimit.reset);
  }
}

export function getGitHubHeaders(): HeadersInit {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Ferix-Skills-Directory",
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
  };
}
