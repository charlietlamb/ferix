import { Schema as S } from "effect";

export const LogLevelSchema = S.Literal("debug", "info", "warn", "error");
export type LogLevel = typeof LogLevelSchema.Type;

export const LogEntrySchema = S.Struct({
  level: LogLevelSchema,
  message: S.String,
  timestamp: S.String,
  context: S.optional(S.Record({ key: S.String, value: S.Unknown })),
});
export type LogEntry = typeof LogEntrySchema.Type;

export const ConsoleLoggerConfigSchema = S.Struct({
  level: S.optional(LogLevelSchema),
  colors: S.optional(S.Boolean),
});
export type ConsoleLoggerConfig = typeof ConsoleLoggerConfigSchema.Type;

export const FileLoggerConfigSchema = S.Struct({
  path: S.optional(S.String),
  level: S.optional(LogLevelSchema),
});
export type FileLoggerConfig = typeof FileLoggerConfigSchema.Type;
