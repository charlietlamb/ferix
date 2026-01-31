import { Schema } from "effect";

/**
 * Authentication credentials stored for CLI access.
 */
export const Credentials = Schema.Struct({
  accessToken: Schema.String,
  refreshToken: Schema.optionalWith(Schema.String, { as: "Option" }),
  expiresAt: Schema.optionalWith(Schema.Number, { as: "Option" }),
  userId: Schema.optionalWith(Schema.String, { as: "Option" }),
  email: Schema.optionalWith(Schema.String, { as: "Option" }),
  name: Schema.optionalWith(Schema.String, { as: "Option" }),
});

export type Credentials = typeof Credentials.Type;

/**
 * Schema for the credentials file stored on disk.
 */
export const CredentialsFile = Schema.Struct({
  version: Schema.Literal(1),
  credentials: Credentials,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type CredentialsFile = typeof CredentialsFile.Type;

/**
 * Device code response from the auth server.
 */
export const DeviceCodeResponse = Schema.Struct({
  deviceCode: Schema.String,
  userCode: Schema.String,
  verificationUri: Schema.String,
  verificationUriComplete: Schema.optionalWith(Schema.String, { as: "Option" }),
  expiresIn: Schema.Number,
  interval: Schema.Number,
});

export type DeviceCodeResponse = typeof DeviceCodeResponse.Type;

/**
 * Token response from the auth server after device authorization.
 */
export const TokenResponse = Schema.Struct({
  accessToken: Schema.String,
  tokenType: Schema.String,
  expiresIn: Schema.optionalWith(Schema.Number, { as: "Option" }),
  refreshToken: Schema.optionalWith(Schema.String, { as: "Option" }),
  scope: Schema.optionalWith(Schema.String, { as: "Option" }),
});

export type TokenResponse = typeof TokenResponse.Type;

/**
 * Authentication status for the CLI.
 */
export type AuthStatus =
  | { readonly status: "authenticated"; readonly credentials: Credentials }
  | { readonly status: "unauthenticated" }
  | { readonly status: "expired"; readonly credentials: Credentials };
