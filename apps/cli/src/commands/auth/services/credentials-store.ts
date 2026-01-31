import { Context, type Effect } from "effect";
import type {
  AuthStatus,
  Credentials,
  CredentialsStoreError,
} from "../domain/index.js";

/**
 * Service interface for managing CLI authentication credentials.
 *
 * Credentials are stored in ~/.ferix/credentials.json and include
 * access tokens obtained through the device authorization flow.
 *
 * @example
 * ```typescript
 * const store = yield* CredentialsStore;
 *
 * // Save credentials after successful login
 * yield* store.save({
 *   accessToken: "token123",
 *   refreshToken: Option.some("refresh456"),
 *   expiresAt: Option.some(Date.now() + 3600000),
 *   userId: Option.some("user-id"),
 *   email: Option.some("user@example.com"),
 *   name: Option.some("User Name"),
 * });
 *
 * // Check auth status
 * const status = yield* store.getStatus();
 * if (status.status === "authenticated") {
 *   console.log("Logged in as:", status.credentials.email);
 * }
 * ```
 */
export interface CredentialsStoreService {
  /**
   * Save authentication credentials.
   *
   * @param credentials - The credentials to save
   */
  readonly save: (
    credentials: Credentials
  ) => Effect.Effect<void, CredentialsStoreError>;

  /**
   * Load stored credentials.
   *
   * @returns The credentials if they exist, or an error if not found
   */
  readonly load: () => Effect.Effect<Credentials, CredentialsStoreError>;

  /**
   * Delete stored credentials (logout).
   */
  readonly clear: () => Effect.Effect<void, CredentialsStoreError>;

  /**
   * Get the current authentication status.
   *
   * @returns The auth status including whether credentials exist and are valid
   */
  readonly getStatus: () => Effect.Effect<AuthStatus, CredentialsStoreError>;
}

/**
 * Effect Tag for the CredentialsStore service.
 *
 * Use this tag to depend on credential storage without coupling to a specific backend.
 */
export class CredentialsStore extends Context.Tag("@ferix/CredentialsStore")<
  CredentialsStore,
  CredentialsStoreService
>() {}
