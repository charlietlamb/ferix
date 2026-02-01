import { Schema as S } from "effect";
import type { DomainEvent, LoopConfig } from "../domain/index.js";

/**
 * Session info exposed by the daemon for listing.
 */
const SessionInfoSchema = S.Struct({
  sessionId: S.String,
  task: S.String,
  status: S.Literal("starting", "running", "paused", "completed", "failed"),
  startedAt: S.Number,
  completedAt: S.optional(S.Number),
});
export type SessionInfo = typeof SessionInfoSchema.Type;

/**
 * Commands from TUI → Daemon
 */
const DaemonCommandSchema = S.Union(
  S.Struct({
    type: S.Literal("start"),
    sessionId: S.String,
    config: S.Unknown, // LoopConfig - validated separately
  }),
  S.Struct({
    type: S.Literal("pause"),
    sessionId: S.String,
  }),
  S.Struct({
    type: S.Literal("resume"),
    sessionId: S.String,
  }),
  S.Struct({
    type: S.Literal("cancel"),
    sessionId: S.String,
  }),
  S.Struct({
    type: S.Literal("list"),
  }),
  S.Struct({
    type: S.Literal("status"),
    sessionId: S.String,
  }),
  S.Struct({
    type: S.Literal("subscribe"),
    sessionId: S.String,
  }),
  S.Struct({
    type: S.Literal("unsubscribe"),
    sessionId: S.String,
  }),
  S.Struct({
    type: S.Literal("shutdown"),
  }),
  S.Struct({
    type: S.Literal("version"),
  })
);
export type DaemonCommand = typeof DaemonCommandSchema.Type;

/**
 * Responses from Daemon → TUI (one-shot replies)
 */
const DaemonResponseSchema = S.Union(
  S.Struct({
    type: S.Literal("ok"),
    sessionId: S.optional(S.String),
  }),
  S.Struct({
    type: S.Literal("error"),
    message: S.String,
  }),
  S.Struct({
    type: S.Literal("sessions"),
    sessions: S.Array(SessionInfoSchema),
  }),
  S.Struct({
    type: S.Literal("session_status"),
    session: SessionInfoSchema,
  }),
  S.Struct({
    type: S.Literal("version"),
    buildTime: S.Number,
  })
);
export type DaemonResponse = typeof DaemonResponseSchema.Type;

/**
 * Session status type.
 */
export type SessionStatus =
  | "starting"
  | "running"
  | "paused"
  | "completed"
  | "failed";

/**
 * Schema for DaemonDomainEvent - events streamed Daemon → TUI.
 * Wraps DomainEvent with session context.
 */
const DaemonDomainEventSchema = S.Struct({
  type: S.Literal("event"),
  sessionId: S.String,
  event: S.Unknown, // DomainEvent validated at domain layer
});
export interface DaemonDomainEvent {
  readonly type: "event";
  readonly sessionId: string;
  readonly event: DomainEvent;
}

/**
 * Schema for DaemonSessionStatusEvent.
 * Sent when a session's status changes (e.g., running -> completed).
 */
const DaemonSessionStatusEventSchema = S.Struct({
  type: S.Literal("session_status_changed"),
  sessionId: S.String,
  status: S.Literal("starting", "running", "paused", "completed", "failed"),
  completedAt: S.optional(S.Number),
});
export type DaemonSessionStatusEvent =
  typeof DaemonSessionStatusEventSchema.Type;

/**
 * Combined DaemonEvent schema.
 */
const DaemonEventSchema = S.Union(
  DaemonDomainEventSchema,
  DaemonSessionStatusEventSchema
);

/**
 * Union of all daemon event types.
 */
export type DaemonEvent = DaemonDomainEvent | DaemonSessionStatusEvent;

/**
 * Combined DaemonMessage schema.
 */
const DaemonMessageSchema = S.Union(DaemonResponseSchema, DaemonEventSchema);

/**
 * All messages that can be sent from daemon to client.
 */
export type DaemonMessage = DaemonResponse | DaemonEvent;

/**
 * Parse a JSON line into a DaemonCommand.
 */
export function parseCommand(line: string): DaemonCommand | null {
  try {
    const parsed = JSON.parse(line);
    const result = S.decodeUnknownSync(DaemonCommandSchema)(parsed);
    return result;
  } catch {
    return null;
  }
}

/**
 * Parse a JSON line into a DaemonMessage.
 * Uses schema validation for all message types.
 */
export function parseMessage(line: string): DaemonMessage | null {
  try {
    const parsed = JSON.parse(line);

    // Try to parse using the combined message schema
    const result = S.decodeUnknownSync(DaemonMessageSchema)(parsed);

    // For DaemonDomainEvent, we validated structure but event is S.Unknown
    // The event content is validated at the domain layer when needed
    return result as DaemonMessage;
  } catch {
    return null;
  }
}

/**
 * Serialize a message for transmission (JSON + newline).
 */
export function serializeMessage(message: DaemonMessage): string {
  return `${JSON.stringify(message)}\n`;
}

/**
 * Serialize a command for transmission (JSON + newline).
 */
export function serializeCommand(command: DaemonCommand): string {
  return `${JSON.stringify(command)}\n`;
}

/**
 * Type guard for DaemonDomainEvent (contains a DomainEvent).
 */
export function isDaemonDomainEvent(
  message: DaemonMessage
): message is DaemonDomainEvent {
  return message.type === "event";
}

/**
 * Type guard for DaemonSessionStatusEvent.
 */
export function isDaemonSessionStatusEvent(
  message: DaemonMessage
): message is DaemonSessionStatusEvent {
  return message.type === "session_status_changed";
}

/**
 * Type guard for DaemonResponse.
 */
export function isDaemonResponse(
  message: DaemonMessage
): message is DaemonResponse {
  return message.type !== "event";
}

/**
 * Schema for validating LoopConfig received over the socket.
 * This mirrors the essential structure for validation purposes.
 */
const LoopConfigValidationSchema = S.Struct({
  task: S.String,
  maxIterations: S.Number,
  verifyCommands: S.Array(S.String),
  sessionId: S.optional(S.String),
  branch: S.optional(S.String),
  push: S.optional(S.Boolean),
  pr: S.optional(S.Boolean),
  verbose: S.optional(S.Boolean),
  prompts: S.optional(S.Unknown),
  provider: S.optional(S.Literal("claude", "cursor", "opencode")),
  yolo: S.optional(S.Boolean),
  debug: S.optional(S.Boolean),
});

/**
 * Parse and validate a LoopConfig from unknown data.
 * Returns null if validation fails.
 */
export function parseLoopConfig(config: unknown): LoopConfig | null {
  try {
    const result = S.decodeUnknownSync(LoopConfigValidationSchema)(config);
    return result as LoopConfig;
  } catch {
    return null;
  }
}
