import { Data } from "effect";

/**
 * Error that occurs during credentials storage operations.
 */
export class CredentialsStoreError extends Data.TaggedError(
  "CredentialsStoreError"
)<{
  readonly message: string;
  readonly operation: "read" | "write" | "delete";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs during device authorization flow.
 */
export class DeviceAuthError extends Data.TaggedError("DeviceAuthError")<{
  readonly message: string;
  readonly code:
    | "authorization_pending"
    | "slow_down"
    | "access_denied"
    | "expired_token"
    | "network_error"
    | "unknown";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs when auth credentials are not found.
 */
export class NotAuthenticatedError extends Data.TaggedError(
  "NotAuthenticatedError"
)<{
  readonly message: string;
}> {}
