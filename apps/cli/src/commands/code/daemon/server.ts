import { spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer, type Socket } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { Effect, Fiber, Ref, Stream } from "effect";
import type { DomainEvent, LoopConfig } from "../domain/index.js";
import { createProductionLayers, ProductionLayers } from "../layers/index.js";
import { runLoop } from "../orchestrator/index.js";
import { createDaemonClient } from "./client.js";
import {
  type DaemonCommand,
  type DaemonDomainEvent,
  type DaemonMessage,
  type DaemonSessionStatusEvent,
  parseCommand,
  parseLoopConfig,
  type SessionInfo,
  type SessionStatus,
  serializeMessage,
} from "./protocol.js";

/**
 * Default socket path for the daemon.
 */
export function getSocketPath(): string {
  const ferixDir = join(homedir(), ".ferix");
  return join(ferixDir, "daemon.sock");
}

/**
 * PID file path.
 */
function getPidPath(): string {
  const ferixDir = join(homedir(), ".ferix");
  return join(ferixDir, "daemon.pid");
}

/**
 * Ensure the .ferix directory exists.
 */
function ensureFerixDir(): void {
  const ferixDir = join(homedir(), ".ferix");
  if (!existsSync(ferixDir)) {
    mkdirSync(ferixDir, { recursive: true });
  }
}

/**
 * Get the build time of the CLI bundle.
 * Uses the file's modification time as a version identifier.
 */
function getBundleBuildTime(): number {
  try {
    // process.argv[1] is the path to the CLI script (dist/index.js)
    const cliPath = process.argv[1];
    if (!cliPath) {
      return 0;
    }
    const stats = statSync(cliPath);
    return stats.mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Build time captured when daemon starts.
 * Used to detect when the CLI has been rebuilt.
 */
let daemonBuildTime = 0;

/**
 * Active session state tracked by the daemon.
 */
interface ActiveSession {
  readonly info: SessionInfo;
  readonly fiber: Fiber.RuntimeFiber<void, unknown>;
  readonly subscribers: Set<Socket>;
}

/**
 * Client connection state.
 */
interface ClientState {
  readonly socket: Socket;
  readonly buffer: string;
  readonly subscriptions: Set<string>;
}

/**
 * Daemon server state.
 */
interface DaemonState {
  readonly sessions: Map<string, ActiveSession>;
  readonly clients: Map<Socket, ClientState>;
  /** Buffer for partial output lines per session (streaming LLM text). */
  readonly outputBuffers: Map<string, string>;
}

/**
 * Create initial daemon state.
 */
function createInitialState(): DaemonState {
  return {
    sessions: new Map(),
    clients: new Map(),
    outputBuffers: new Map(),
  };
}

/**
 * Send a message to a client.
 */
function sendToClient(socket: Socket, message: DaemonMessage): void {
  if (!socket.destroyed) {
    socket.write(serializeMessage(message));
  }
}

/**
 * Broadcast a domain event to all subscribers of a session.
 */
function broadcastDomainEvent(
  state: DaemonState,
  sessionId: string,
  event: DomainEvent
): void {
  const session = state.sessions.get(sessionId);
  if (!session) {
    return;
  }

  const daemonEvent: DaemonDomainEvent = {
    type: "event",
    sessionId,
    event,
  };

  for (const socket of session.subscribers) {
    sendToClient(socket, daemonEvent);
  }
}

/**
 * Get the output directory path for a session (global, in user's home directory).
 */
function getSessionOutputDir(sessionId: string): string {
  return join(homedir(), ".ferix", "sessions", sessionId);
}

/**
 * Get the output file path for a session.
 */
function getSessionOutputPath(sessionId: string): string {
  return join(getSessionOutputDir(sessionId), "output.log");
}

/**
 * Ensure the session output directory exists.
 */
function ensureSessionOutputDir(sessionId: string): void {
  const dir = getSessionOutputDir(sessionId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Format tool input for display (simplified version for daemon).
 * Extracts a relevant string field from the tool input.
 */
function formatToolInputForOutput(tool: string, input: unknown): string {
  if (!input || typeof input !== "object") {
    return "";
  }

  const obj = input as Record<string, unknown>;

  // Map of tool names to their primary display field
  const toolInputKeys: Record<string, string[]> = {
    read: ["file_path", "filePath"],
    edit: ["file_path", "filePath"],
    write: ["file_path", "filePath"],
    bash: ["command"],
    glob: ["pattern"],
    grep: ["pattern"],
    task: ["description"],
    webfetch: ["url"],
    websearch: ["query"],
  };

  const normalizedTool = tool.toLowerCase();
  const keys = toolInputKeys[normalizedTool];
  if (!keys) {
    return "";
  }

  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") {
      // Truncate long values
      const maxLen = 80;
      return value.length > maxLen ? `${value.slice(0, maxLen)}...` : value;
    }
  }

  return "";
}

/**
 * Result from extracting output from an event.
 */
type ExtractedOutput =
  | { type: "lines"; lines: readonly string[] }
  | { type: "streaming"; text: string };

/**
 * Extract output from a domain event.
 * Returns either complete lines (for non-streaming events) or raw streaming text.
 */
function extractOutput(event: DomainEvent): ExtractedOutput | null {
  switch (event._tag) {
    case "LLMText": {
      // LLM streaming text - return raw text for buffering
      const text = event.text;
      if (!text) {
        return null;
      }
      return { type: "streaming", text };
    }

    case "LLMToolUse": {
      // Tool execution - format as >> tool detail
      const detail = formatToolInputForOutput(event.tool, event.input);
      const toolLine = detail
        ? `>> ${event.tool} ${detail}`
        : `>> ${event.tool}`;
      return { type: "lines", lines: [toolLine, ""] };
    }

    case "WorktreeCreated": {
      return {
        type: "lines",
        lines: [
          `Git worktree created: ${event.branchName}`,
          `  Path: ${event.worktreePath}`,
          "",
        ],
      };
    }

    case "BranchPushed": {
      return {
        type: "lines",
        lines: [`Branch pushed: ${event.branchName}`, ""],
      };
    }

    case "PRCreated": {
      return {
        type: "lines",
        lines: [`PR created: ${event.prUrl}`, `  Title: ${event.title}`, ""],
      };
    }

    case "LoopFailed": {
      return {
        type: "lines",
        lines: [
          "",
          "═══════════════════════════════════════════════════════════════",
          "                           ERROR",
          "═══════════════════════════════════════════════════════════════",
          "",
          event.error.message,
          "",
          "═══════════════════════════════════════════════════════════════",
          "",
        ],
      };
    }

    case "PushFailed": {
      return { type: "lines", lines: [`Push failed: ${event.error}`, ""] };
    }

    case "PRCreationFailed": {
      return {
        type: "lines",
        lines: [`PR creation failed: ${event.error}`, ""],
      };
    }

    case "TaskCommitted": {
      return {
        type: "lines",
        lines: [`Task committed: ${event.commitHash.slice(0, 7)}`, ""],
      };
    }

    default:
      return null;
  }
}

/**
 * Persist output lines to the session's output log file.
 */
function persistOutputLines(sessionId: string, lines: readonly string[]): void {
  if (lines.length === 0) {
    return;
  }

  try {
    ensureSessionOutputDir(sessionId);
    const outputPath = getSessionOutputPath(sessionId);
    const content = `${lines.join("\n")}\n`;
    appendFileSync(outputPath, content, "utf-8");
  } catch (error) {
    // Log but don't disrupt event flow
    console.error(
      `[daemon] Failed to persist output for session ${sessionId}:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Process an event and persist any output to the session's log file.
 * Handles buffering of streaming LLM text to produce complete lines.
 */
function processAndPersistOutput(
  stateRef: Ref.Ref<DaemonState>,
  sessionId: string,
  event: DomainEvent
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const output = extractOutput(event);
    if (!output) {
      return;
    }

    if (output.type === "lines") {
      // Non-streaming output - persist complete lines directly
      persistOutputLines(sessionId, output.lines);
      return;
    }

    // Streaming text - buffer and extract complete lines
    const state = yield* Ref.get(stateRef);
    const currentBuffer = state.outputBuffers.get(sessionId) ?? "";
    const newBuffer = currentBuffer + output.text;

    // Find all complete lines (ending with \n)
    const lines: string[] = [];
    let lastNewlineIndex = -1;

    for (let i = 0; i < newBuffer.length; i++) {
      if (newBuffer[i] === "\n") {
        lines.push(newBuffer.slice(lastNewlineIndex + 1, i));
        lastNewlineIndex = i;
      }
    }

    // Store remaining partial line in buffer
    const remaining = newBuffer.slice(lastNewlineIndex + 1);
    yield* Ref.update(stateRef, (s) => {
      const outputBuffers = new Map(s.outputBuffers);
      if (remaining) {
        outputBuffers.set(sessionId, remaining);
      } else {
        outputBuffers.delete(sessionId);
      }
      return { ...s, outputBuffers };
    });

    // Persist complete lines
    if (lines.length > 0) {
      persistOutputLines(sessionId, lines);
    }
  });
}

/**
 * Flush any remaining buffered output for a session.
 * Called when session completes or fails.
 */
function flushSessionOutputBuffer(
  stateRef: Ref.Ref<DaemonState>,
  sessionId: string
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    const remaining = state.outputBuffers.get(sessionId);
    if (remaining) {
      persistOutputLines(sessionId, [remaining]);
      yield* Ref.update(stateRef, (s) => {
        const outputBuffers = new Map(s.outputBuffers);
        outputBuffers.delete(sessionId);
        return { ...s, outputBuffers };
      });
    }
  });
}

/**
 * Broadcast a session status change to all subscribers.
 */
function broadcastStatusChange(
  state: DaemonState,
  sessionId: string,
  status: SessionStatus,
  completedAt?: number
): void {
  const session = state.sessions.get(sessionId);
  if (!session) {
    return;
  }

  const statusEvent: DaemonSessionStatusEvent = {
    type: "session_status_changed",
    sessionId,
    status,
    completedAt,
  };

  for (const socket of session.subscribers) {
    sendToClient(socket, statusEvent);
  }
}

/**
 * Handle the "start" command - start a new session.
 */
function handleStartCommand(
  stateRef: Ref.Ref<DaemonState>,
  socket: Socket,
  sessionId: string,
  rawConfig: unknown
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    const config = parseLoopConfig(rawConfig);

    // Validate config
    if (!config) {
      sendToClient(socket, {
        type: "error",
        message: "Invalid config format",
      });
      return;
    }

    // Check if session already exists
    if (state.sessions.has(sessionId)) {
      sendToClient(socket, {
        type: "error",
        message: `Session ${sessionId} already exists`,
      });
      return;
    }

    // Start the session in a fiber
    const fiber = yield* startSession(stateRef, sessionId, config);

    // Create session info
    const info: SessionInfo = {
      sessionId,
      task: config.task,
      status: "starting",
      startedAt: Date.now(),
    };

    // Add session to state
    const newSession: ActiveSession = {
      info,
      fiber,
      subscribers: new Set([socket]),
    };

    yield* Ref.update(stateRef, (s) => ({
      ...s,
      sessions: new Map(s.sessions).set(sessionId, newSession),
    }));

    // Also update client subscriptions
    yield* Ref.update(stateRef, (s) => {
      const clients = new Map(s.clients);
      const client = clients.get(socket);
      if (client) {
        const subscriptions = new Set(client.subscriptions);
        subscriptions.add(sessionId);
        clients.set(socket, { ...client, subscriptions });
      }
      return { ...s, clients };
    });

    sendToClient(socket, { type: "ok", sessionId });
  });
}

/**
 * Handle the "pause" command - pause a running session.
 */
function handlePauseCommand(
  stateRef: Ref.Ref<DaemonState>,
  socket: Socket,
  sessionId: string
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    const session = state.sessions.get(sessionId);

    if (!session) {
      sendToClient(socket, {
        type: "error",
        message: `Session ${sessionId} not found`,
      });
      return;
    }

    // Interrupt the fiber
    yield* Fiber.interrupt(session.fiber);

    // Update session status
    yield* Ref.update(stateRef, (s) => {
      const sessions = new Map(s.sessions);
      const sess = sessions.get(sessionId);
      if (sess) {
        sessions.set(sessionId, {
          ...sess,
          info: { ...sess.info, status: "paused" },
        });
      }
      return { ...s, sessions };
    });

    // Broadcast status change to subscribers
    const updatedState = yield* Ref.get(stateRef);
    broadcastStatusChange(updatedState, sessionId, "paused");

    sendToClient(socket, { type: "ok", sessionId });
  });
}

/**
 * Handle the "cancel" command - cancel a running session.
 */
function handleCancelCommand(
  stateRef: Ref.Ref<DaemonState>,
  socket: Socket,
  sessionId: string
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    const session = state.sessions.get(sessionId);

    if (!session) {
      sendToClient(socket, {
        type: "error",
        message: `Session ${sessionId} not found`,
      });
      return;
    }

    // Interrupt the fiber
    yield* Fiber.interrupt(session.fiber);

    const completedAt = Date.now();

    // Update session status and remove
    yield* Ref.update(stateRef, (s) => {
      const sessions = new Map(s.sessions);
      const sess = sessions.get(sessionId);
      if (sess) {
        sessions.set(sessionId, {
          ...sess,
          info: { ...sess.info, status: "failed", completedAt },
        });
      }
      return { ...s, sessions };
    });

    // Broadcast status change to subscribers
    const updatedState = yield* Ref.get(stateRef);
    broadcastStatusChange(updatedState, sessionId, "failed", completedAt);

    sendToClient(socket, { type: "ok", sessionId });
  });
}

/**
 * Handle the "subscribe" command - subscribe to session events.
 */
function handleSubscribeCommand(
  stateRef: Ref.Ref<DaemonState>,
  socket: Socket,
  sessionId: string
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    const session = state.sessions.get(sessionId);

    if (!session) {
      sendToClient(socket, {
        type: "error",
        message: `Session ${sessionId} not found`,
      });
      return;
    }

    // Add socket to subscribers
    yield* Ref.update(stateRef, (s) => {
      const sessions = new Map(s.sessions);
      const sess = sessions.get(sessionId);
      if (sess) {
        sess.subscribers.add(socket);
      }

      const clients = new Map(s.clients);
      const client = clients.get(socket);
      if (client) {
        client.subscriptions.add(sessionId);
      }

      return { ...s, sessions, clients };
    });

    sendToClient(socket, { type: "ok", sessionId });
  });
}

/**
 * Handle the "unsubscribe" command - unsubscribe from session events.
 */
function handleUnsubscribeCommand(
  stateRef: Ref.Ref<DaemonState>,
  socket: Socket,
  sessionId: string
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    yield* Ref.update(stateRef, (s) => {
      const sessions = new Map(s.sessions);
      const sess = sessions.get(sessionId);
      if (sess) {
        sess.subscribers.delete(socket);
      }

      const clients = new Map(s.clients);
      const client = clients.get(socket);
      if (client) {
        client.subscriptions.delete(sessionId);
      }

      return { ...s, sessions, clients };
    });

    sendToClient(socket, { type: "ok", sessionId });
  });
}

/**
 * Handle a command from a client.
 */
function handleCommand(
  stateRef: Ref.Ref<DaemonState>,
  socket: Socket,
  command: DaemonCommand
): Effect.Effect<void, never, never> {
  switch (command.type) {
    case "start":
      return handleStartCommand(
        stateRef,
        socket,
        command.sessionId,
        command.config
      );

    case "pause":
      return handlePauseCommand(stateRef, socket, command.sessionId);

    case "resume":
      return Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const session = state.sessions.get(command.sessionId);
        if (!session) {
          sendToClient(socket, {
            type: "error",
            message: `Session ${command.sessionId} not found`,
          });
          return;
        }
        // Resume is complex - would need to reload state and restart
        sendToClient(socket, {
          type: "error",
          message:
            "Resume not yet implemented - use start with same session ID",
        });
      });

    case "cancel":
      return handleCancelCommand(stateRef, socket, command.sessionId);

    case "list":
      return Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const sessions = Array.from(state.sessions.values()).map((s) => s.info);
        sendToClient(socket, { type: "sessions", sessions });
      });

    case "status":
      return Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const session = state.sessions.get(command.sessionId);
        if (!session) {
          sendToClient(socket, {
            type: "error",
            message: `Session ${command.sessionId} not found`,
          });
          return;
        }
        sendToClient(socket, { type: "session_status", session: session.info });
      });

    case "subscribe":
      return handleSubscribeCommand(stateRef, socket, command.sessionId);

    case "unsubscribe":
      return handleUnsubscribeCommand(stateRef, socket, command.sessionId);

    case "shutdown":
      return Effect.sync(() => {
        sendToClient(socket, { type: "ok" });
        // Give client time to receive response, then exit
        setTimeout(() => process.exit(0), 100);
      });

    case "version":
      return Effect.sync(() => {
        sendToClient(socket, { type: "version", buildTime: daemonBuildTime });
      });

    default:
      return Effect.sync(() => {
        sendToClient(socket, {
          type: "error",
          message: "Unknown command type",
        });
      });
  }
}

/**
 * Start a session and return its fiber.
 */
function startSession(
  stateRef: Ref.Ref<DaemonState>,
  sessionId: string,
  config: LoopConfig
): Effect.Effect<Fiber.RuntimeFiber<void, unknown>, never, never> {
  const configWithSession = { ...config, sessionId };

  // Get events stream
  const events = runLoop(configWithSession);

  // Select layers based on provider
  const layers = config.provider
    ? createProductionLayers(config.provider)
    : ProductionLayers;

  // Provide layers
  const eventsWithLayers = events.pipe(Stream.provideLayer(layers));

  // Create the session effect
  const sessionEffect = Effect.gen(function* () {
    // Update status to running
    yield* Ref.update(stateRef, (s) => {
      const sessions = new Map(s.sessions);
      const sess = sessions.get(sessionId);
      if (sess) {
        sessions.set(sessionId, {
          ...sess,
          info: { ...sess.info, status: "running" },
        });
      }
      return { ...s, sessions };
    });

    // Broadcast status change to running
    const runningState = yield* Ref.get(stateRef);
    broadcastStatusChange(runningState, sessionId, "running");

    // Process events and broadcast to subscribers
    yield* eventsWithLayers.pipe(
      Stream.runForEach((event) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          broadcastDomainEvent(state, sessionId, event);

          // Persist output to file for later viewing (with buffering for streaming text)
          yield* processAndPersistOutput(stateRef, sessionId, event);
        })
      )
    );

    // Flush any remaining buffered output
    yield* flushSessionOutputBuffer(stateRef, sessionId);

    const completedAt = Date.now();

    // Update status to completed
    yield* Ref.update(stateRef, (s) => {
      const sessions = new Map(s.sessions);
      const sess = sessions.get(sessionId);
      if (sess) {
        sessions.set(sessionId, {
          ...sess,
          info: { ...sess.info, status: "completed", completedAt },
        });
      }
      return { ...s, sessions };
    });

    // Broadcast status change to completed
    const completedState = yield* Ref.get(stateRef);
    broadcastStatusChange(completedState, sessionId, "completed", completedAt);
  });

  // Handle errors
  const sessionWithErrorHandling = sessionEffect.pipe(
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        // Flush any remaining buffered output
        yield* flushSessionOutputBuffer(stateRef, sessionId);

        const completedAt = Date.now();

        yield* Ref.update(stateRef, (s) => {
          const sessions = new Map(s.sessions);
          const sess = sessions.get(sessionId);
          if (sess) {
            sessions.set(sessionId, {
              ...sess,
              info: { ...sess.info, status: "failed", completedAt },
            });
          }
          console.error(`Session ${sessionId} failed:`, error);
          return { ...s, sessions };
        });

        // Broadcast status change to failed
        const failedState = yield* Ref.get(stateRef);
        broadcastStatusChange(failedState, sessionId, "failed", completedAt);
      })
    )
  );

  // Fork as daemon fiber
  return Effect.forkDaemon(sessionWithErrorHandling);
}

/**
 * Process incoming data from a socket, extracting complete lines.
 */
function processSocketData(
  stateRef: Ref.Ref<DaemonState>,
  socket: Socket,
  data: Buffer
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    const client = state.clients.get(socket);
    if (!client) {
      return;
    }

    // Accumulate data in buffer
    let buffer = client.buffer + data.toString();

    // Process complete lines
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      const command = parseCommand(line);
      if (command) {
        yield* handleCommand(stateRef, socket, command);
      } else {
        sendToClient(socket, {
          type: "error",
          message: "Invalid command",
        });
      }

      newlineIndex = buffer.indexOf("\n");
    }

    // Update buffer
    yield* Ref.update(stateRef, (s) => {
      const clients = new Map(s.clients);
      const c = clients.get(socket);
      if (c) {
        clients.set(socket, { ...c, buffer });
      }
      return { ...s, clients };
    });
  });
}

/**
 * Handle a new client connection.
 */
function handleConnection(
  stateRef: Ref.Ref<DaemonState>,
  socket: Socket
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    // Add client to state
    const clientState: ClientState = {
      socket,
      buffer: "",
      subscriptions: new Set(),
    };

    yield* Ref.update(stateRef, (s) => ({
      ...s,
      clients: new Map(s.clients).set(socket, clientState),
    }));

    // Set up data handler
    socket.on("data", (data) => {
      Effect.runPromise(processSocketData(stateRef, socket, data));
    });

    // Handle disconnect
    socket.on("close", () => {
      Effect.runPromise(
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const client = state.clients.get(socket);
          if (!client) {
            return;
          }

          // Remove client from all session subscribers
          for (const sessionId of client.subscriptions) {
            yield* Ref.update(stateRef, (s) => {
              const sessions = new Map(s.sessions);
              const sess = sessions.get(sessionId);
              if (sess) {
                sess.subscribers.delete(socket);
              }
              return { ...s, sessions };
            });
          }

          // Remove client
          yield* Ref.update(stateRef, (s) => {
            const clients = new Map(s.clients);
            clients.delete(socket);
            return { ...s, clients };
          });
        })
      );
    });

    socket.on("error", (err) => {
      console.error("Client socket error:", err.message);
    });
  });
}

/**
 * Clean up socket file if it exists.
 */
function cleanupSocket(socketPath: string): void {
  if (existsSync(socketPath)) {
    unlinkSync(socketPath);
  }
}

/**
 * Write PID file.
 */
function writePidFile(): void {
  ensureFerixDir();
  writeFileSync(getPidPath(), process.pid.toString());
}

/**
 * Remove PID file.
 */
function removePidFile(): void {
  const pidPath = getPidPath();
  if (existsSync(pidPath)) {
    unlinkSync(pidPath);
  }
}

/**
 * Start the daemon server.
 */
export function startDaemon(): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const socketPath = getSocketPath();

    // Capture build time at startup for version checking
    daemonBuildTime = getBundleBuildTime();

    // Ensure directory exists and clean up old socket
    ensureFerixDir();
    cleanupSocket(socketPath);

    // Write PID file
    writePidFile();

    // Create state ref
    const stateRef = yield* Ref.make(createInitialState());

    // Create server
    const server = createServer((socket) => {
      Effect.runPromise(handleConnection(stateRef, socket));
    });

    // Set up cleanup handlers
    const cleanup = () => {
      cleanupSocket(socketPath);
      removePidFile();
      server.close();
    };

    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });

    process.on("exit", cleanup);

    // Start listening
    yield* Effect.async<void, never>((resume) => {
      server.listen(socketPath, () => {
        console.log(`Daemon listening on ${socketPath}`);
        console.log(`PID: ${process.pid}`);
        resume(Effect.succeed(undefined));
      });

      server.on("error", (err) => {
        console.error("Server error:", err);
        cleanup();
        process.exit(1);
      });
    });

    // Keep running forever
    yield* Effect.never;
  });
}

/**
 * Check if daemon is running.
 */
export function isDaemonRunning(): boolean {
  const pidPath = getPidPath();
  const socketPath = getSocketPath();

  if (!(existsSync(pidPath) && existsSync(socketPath))) {
    return false;
  }

  try {
    const pid = Number.parseInt(readFileSync(pidPath, "utf-8").trim(), 10);
    // Check if process is running by sending signal 0
    process.kill(pid, 0);
    return true;
  } catch {
    // Process not running, clean up stale files
    cleanupSocket(socketPath);
    removePidFile();
    return false;
  }
}

/**
 * Get daemon PID if running.
 */
export function getDaemonPid(): number | null {
  const pidPath = getPidPath();

  if (!existsSync(pidPath)) {
    return null;
  }

  try {
    const pid = Number.parseInt(readFileSync(pidPath, "utf-8").trim(), 10);
    process.kill(pid, 0);
    return pid;
  } catch {
    return null;
  }
}

/**
 * Stop the daemon.
 */
export function stopDaemon(): boolean {
  const pid = getDaemonPid();
  if (pid === null) {
    return false;
  }

  try {
    process.kill(pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for the daemon to be ready by polling for the socket file.
 */
function waitForDaemonReady(
  maxAttempts: number,
  intervalMs: number
): Effect.Effect<void, never, never> {
  const socketPath = getSocketPath();

  return Effect.gen(function* () {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Check if socket file exists and daemon is responding
      if (existsSync(socketPath) && isDaemonRunning()) {
        return;
      }
      yield* Effect.sleep(intervalMs);
    }
    // If we get here, daemon didn't start in time, but we'll let the
    // connection attempt handle the error with a better message
  });
}

/**
 * Check if daemon is running stale code by comparing build times.
 * Returns true if daemon needs restart.
 */
function checkDaemonVersionMismatch(): Effect.Effect<boolean, never, never> {
  return Effect.gen(function* () {
    const currentBuildTime = getBundleBuildTime();
    if (currentBuildTime === 0) {
      // Can't determine build time, assume no mismatch
      return false;
    }

    const client = createDaemonClient();

    // Try to connect and get version
    const daemonBuildTime = yield* client.connect().pipe(
      Effect.flatMap(() => client.getVersion()),
      Effect.tap(() => client.disconnect()),
      Effect.catchAll(() => Effect.succeed(0))
    );

    // If daemon build time is 0, it's an old daemon without version support
    // or something went wrong - restart to be safe
    if (daemonBuildTime === 0) {
      return true;
    }

    // Check if build times differ
    return Math.abs(currentBuildTime - daemonBuildTime) > 1000; // Allow 1 second tolerance
  });
}

/**
 * Spawn a new daemon process.
 */
function spawnDaemon(): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    // Spawn the CLI itself with the hidden __daemon command
    // process.execPath = path to node executable
    // process.argv[1] = path to the CLI script (dist/index.js)
    const cliPath = process.argv[1];
    if (!cliPath) {
      // This should never happen in normal CLI execution
      return;
    }

    const child = spawn(process.execPath, [cliPath, "__daemon"], {
      detached: true,
      stdio: "ignore",
    });

    child.unref();

    // Wait for daemon to be ready (poll every 100ms, up to 5 seconds)
    yield* waitForDaemonReady(50, 100);
  });
}

/**
 * Ensure daemon is running with up-to-date code.
 *
 * This spawns the CLI with the hidden __daemon command as a detached background process.
 * If the daemon is running but has stale code (different build time), it will be restarted.
 * The function returns an Effect that completes once the daemon is ready.
 *
 * @returns Effect that completes when daemon is running with current code
 */
export function ensureDaemonRunning(): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    if (isDaemonRunning()) {
      // Check if daemon has stale code
      const needsRestart = yield* checkDaemonVersionMismatch();

      if (needsRestart) {
        // Stop stale daemon
        stopDaemon();
        // Wait a bit for cleanup
        yield* Effect.sleep(200);
      } else {
        // Daemon is running with current code
        return;
      }
    }

    // Start fresh daemon
    yield* spawnDaemon();
  });
}
