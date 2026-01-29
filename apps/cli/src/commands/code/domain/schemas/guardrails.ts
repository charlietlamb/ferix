import { Schema as S } from "effect";

/**
 * Severity levels for guardrails.
 */
const GuardrailSeveritySchema = S.Literal("warning", "critical");

/**
 * A guardrail represents a failure pattern to avoid.
 *
 * Guardrails are learned from previous iteration failures and
 * help prevent the LLM from repeating the same mistakes.
 */
const GuardrailSchema = S.Struct({
  id: S.String,
  createdAt: S.String,
  iteration: S.Number,
  pattern: S.String,
  sign: S.String,
  avoidance: S.String,
  severity: GuardrailSeveritySchema,
});
export type Guardrail = typeof GuardrailSchema.Type;

/**
 * The complete guardrails file structure.
 *
 * Contains session metadata and an array of guardrails.
 * This is the structure persisted to `.ferix/plans/:sessionId/guardrails.md`.
 */
const GuardrailsFileSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.String,
  guardrails: S.Array(GuardrailSchema),
});
export type GuardrailsFile = typeof GuardrailsFileSchema.Type;

/**
 * Decode helpers.
 */
export const decodeGuardrailsFile = S.decodeUnknown(GuardrailsFileSchema);
