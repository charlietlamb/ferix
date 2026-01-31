import { Data, Schema } from "effect";

/**
 * Stored authentication credentials.
 */
export const CredentialsSchema = Schema.Struct({
  accessToken: Schema.String,
  refreshToken: Schema.optionalWith(Schema.String, { as: "Option" }),
  expiresAt: Schema.Number,
  userId: Schema.String,
  email: Schema.String,
  username: Schema.optionalWith(Schema.String, { as: "Option" }),
});

export type Credentials = Schema.Schema.Type<typeof CredentialsSchema>;

/**
 * Device code response from the auth server.
 */
export const DeviceCodeResponseSchema = Schema.Struct({
  deviceCode: Schema.String,
  userCode: Schema.String,
  verificationUri: Schema.String,
  verificationUriComplete: Schema.optionalWith(Schema.String, { as: "Option" }),
  expiresIn: Schema.Number,
  interval: Schema.Number,
});

export type DeviceCodeResponse = Schema.Schema.Type<
  typeof DeviceCodeResponseSchema
>;

/**
 * Token response after successful device authorization.
 */
export const TokenResponseSchema = Schema.Struct({
  accessToken: Schema.String,
  refreshToken: Schema.optionalWith(Schema.String, { as: "Option" }),
  expiresIn: Schema.Number,
  tokenType: Schema.String,
});

export type TokenResponse = Schema.Schema.Type<typeof TokenResponseSchema>;

/**
 * User info from the auth server.
 */
export const UserInfoSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.optionalWith(Schema.String, { as: "Option" }),
  username: Schema.optionalWith(Schema.String, { as: "Option" }),
});

export type UserInfo = Schema.Schema.Type<typeof UserInfoSchema>;

/**
 * Error that occurs during authentication operations.
 */
export class AuthError extends Data.TaggedError("AuthError")<{
  readonly message: string;
  readonly operation:
    | "login"
    | "logout"
    | "status"
    | "refresh"
    | "deviceCode"
    | "pollToken";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs during credential storage operations.
 */
export class CredentialStoreError extends Data.TaggedError(
  "CredentialStoreError"
)<{
  readonly message: string;
  readonly operation: "read" | "write" | "delete";
  readonly cause?: unknown;
}> {}

/**
 * Polling status during device code flow.
 */
export type PollStatus =
  | { type: "pending" }
  | { type: "approved"; token: TokenResponse }
  | { type: "denied" }
  | { type: "expired" }
  | { type: "slowDown" };
