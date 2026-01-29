/**
 * Effect schemas for tool inputs.
 *
 * These schemas define the expected structure of tool inputs with
 * forward compatibility via S.extend() to allow unknown fields.
 */
import { Either, Schema as S } from "effect";

/**
 * Base schema for extending with additional unknown fields.
 * This provides forward compatibility with new CLI versions.
 */
const ExtendableRecord = S.Record({ key: S.String, value: S.Unknown });

/**
 * Read tool input schema.
 */
const ReadToolInputSchema = S.Struct({
  file_path: S.String,
  offset: S.optional(S.Number),
  limit: S.optional(S.Number),
}).pipe(S.extend(ExtendableRecord));

/**
 * Edit tool input schema.
 */
const EditToolInputSchema = S.Struct({
  file_path: S.String,
  old_string: S.String,
  new_string: S.String,
  replace_all: S.optional(S.Boolean),
}).pipe(S.extend(ExtendableRecord));

/**
 * Write tool input schema.
 */
const WriteToolInputSchema = S.Struct({
  file_path: S.String,
  content: S.String,
}).pipe(S.extend(ExtendableRecord));

/**
 * Bash tool input schema.
 */
const BashToolInputSchema = S.Struct({
  command: S.String,
  description: S.optional(S.String),
  timeout: S.optional(S.Number),
  run_in_background: S.optional(S.Boolean),
}).pipe(S.extend(ExtendableRecord));

/**
 * Glob tool input schema.
 */
const GlobToolInputSchema = S.Struct({
  pattern: S.String,
  path: S.optional(S.String),
}).pipe(S.extend(ExtendableRecord));

/**
 * Grep tool input schema.
 */
const GrepToolInputSchema = S.Struct({
  pattern: S.String,
  path: S.optional(S.String),
  glob: S.optional(S.String),
  type: S.optional(S.String),
  output_mode: S.optional(S.Literal("content", "files_with_matches", "count")),
}).pipe(S.extend(ExtendableRecord));

/**
 * Task tool input schema.
 */
const TaskToolInputSchema = S.Struct({
  description: S.String,
  prompt: S.optional(S.String),
}).pipe(S.extend(ExtendableRecord));

/**
 * WebFetch tool input schema.
 */
const WebFetchToolInputSchema = S.Struct({
  url: S.String,
  prompt: S.optional(S.String),
}).pipe(S.extend(ExtendableRecord));

/**
 * WebSearch tool input schema.
 */
const WebSearchToolInputSchema = S.Struct({
  query: S.String,
}).pipe(S.extend(ExtendableRecord));

/**
 * Registry of tool input schemas.
 */
const ToolInputSchemaRegistry = {
  read: ReadToolInputSchema,
  edit: EditToolInputSchema,
  write: WriteToolInputSchema,
  bash: BashToolInputSchema,
  glob: GlobToolInputSchema,
  grep: GrepToolInputSchema,
  task: TaskToolInputSchema,
  webfetch: WebFetchToolInputSchema,
  websearch: WebSearchToolInputSchema,
} as const;

/**
 * Known tool names.
 */
type KnownToolName = keyof typeof ToolInputSchemaRegistry;

/**
 * Get the input schema for a tool.
 *
 * @param tool - Tool name (case-insensitive)
 * @returns Schema for the tool or undefined if not found
 */
function getToolInputSchema(
  tool: string
): S.Schema<AnyToolInput, AnyToolInput, never> | undefined {
  const normalized = tool.toLowerCase() as KnownToolName;
  if (normalized in ToolInputSchemaRegistry) {
    return ToolInputSchemaRegistry[normalized] as S.Schema<
      AnyToolInput,
      AnyToolInput,
      never
    >;
  }
  return undefined;
}

/**
 * Union of all known tool inputs.
 */
const AnyToolInputSchema = S.Union(
  ReadToolInputSchema,
  EditToolInputSchema,
  WriteToolInputSchema,
  BashToolInputSchema,
  GlobToolInputSchema,
  GrepToolInputSchema,
  TaskToolInputSchema,
  WebFetchToolInputSchema,
  WebSearchToolInputSchema
);
export type AnyToolInput = typeof AnyToolInputSchema.Type;

/**
 * Validate a tool input against its schema.
 *
 * @param tool - Tool name
 * @param input - Input to validate
 * @returns Either with validated input or parse error
 */
export function validateToolInput(
  tool: string,
  input: unknown
): Either.Either<AnyToolInput, unknown> {
  const schema = getToolInputSchema(tool);
  if (!schema) {
    // Unknown tools pass through without validation - cast input as is
    return Either.right(input as AnyToolInput);
  }
  return S.decodeUnknownEither(schema)(input);
}
