import { createConnection, type Socket } from "node:net";
import { Deferred, Effect, Queue, Stream } from "effect";
import type { DomainEvent, LoopConfig } from "../domain/index.js";
import {
  type DaemonCommand,
  type DaemonDomainEvent,
  type DaemonResponse,
  type DaemonSessionStatusEvent,
  isDaemonDomainEvent,
  isDaemonResponse,
  isDaemonSessionStatusEvent,
  parseMessage,
  type SessionInfo,
  type SessionStatus,
  serializeCommand,
} from "./protocol.js";
import { getSocketPath } from "./server.js";

/**
 * Error types for daemon client.
 */
export class DaemonConnectionError extends Error {
  readonly _tag = "DaemonConnectionError";
  constructor(message: string) {
    super(message);
    this.name = "DaemonConnectionError";
  }
}

export class DaemonCommandError extends Error {
  readonly _tag = "DaemonCommandError";
  constructor(message: string) {
    super(message);
    this.name = "DaemonCommandError";
  }
}

/**
 * Daemon client for communicating with the daemon server.
 */
export class DaemonClient {
  private socket: Socket | null = null;
  private buffer = "";
  private responseQueue: Queue.Queue<DaemonResponse> | null = null;
  private domainEventQueue: Queue.Queue<DaemonDomainEvent> | null = null;
  private statusEventQueue: Queue.Queue<DaemonSessionStatusEvent> | null = null;
  private connected = false;

  /**
   * Connect to the daemon.
   */
  connect(): Effect.Effect<void, DaemonConnectionError, never> {
    return Effect.gen(this, function* () {
      const socketPath = getSocketPath();

      // Create bounded queues for responses and events
      // Using reasonable limits to prevent unbounded memory growth
      this.responseQueue = yield* Queue.bounded<DaemonResponse>(100);
      this.domainEventQueue = yield* Queue.bounded<DaemonDomainEvent>(10_000);
      this.statusEventQueue =
        yield* Queue.bounded<DaemonSessionStatusEvent>(1000);

      const responseQueue = this.responseQueue;
      const domainEventQueue = this.domainEventQueue;
      const statusEventQueue = this.statusEventQueue;

      // Create deferred for connection result
      const connectionResult = yield* Deferred.make<
        void,
        DaemonConnectionError
      >();

      // Create socket
      this.socket = createConnection(socketPath);
      const socket = this.socket;

      socket.on("connect", () => {
        this.connected = true;
        Effect.runPromise(Deferred.succeed(connectionResult, undefined));
      });

      socket.on("error", (err) => {
        if (!this.connected) {
          Effect.runPromise(
            Deferred.fail(
              connectionResult,
              new DaemonConnectionError(
                `Failed to connect to daemon: ${err.message}`
              )
            )
          );
        }
      });

      socket.on("data", (data) => {
        this.buffer += data.toString();
        this.processBuffer(responseQueue, domainEventQueue, statusEventQueue);
      });

      socket.on("close", () => {
        this.connected = false;
      });

      // Wait for connection
      yield* Deferred.await(connectionResult);
    });
  }

  /**
   * Disconnect from the daemon.
   */
  disconnect(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      if (this.socket) {
        this.socket.destroy();
        this.socket = null;
      }
      this.connected = false;
    });
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.connected && this.socket !== null;
  }

  /**
   * Process buffered data, extracting complete lines and routing messages.
   */
  private processBuffer(
    responseQueue: Queue.Queue<DaemonResponse>,
    domainEventQueue: Queue.Queue<DaemonDomainEvent>,
    statusEventQueue: Queue.Queue<DaemonSessionStatusEvent>
  ): void {
    let newlineIndex = this.buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);

      const message = parseMessage(line);
      if (message) {
        if (isDaemonDomainEvent(message)) {
          Effect.runPromise(Queue.offer(domainEventQueue, message));
        } else if (isDaemonSessionStatusEvent(message)) {
          Effect.runPromise(Queue.offer(statusEventQueue, message));
        } else if (isDaemonResponse(message)) {
          Effect.runPromise(Queue.offer(responseQueue, message));
        }
      }

      newlineIndex = this.buffer.indexOf("\n");
    }
  }

  /**
   * Send a command and wait for response.
   */
  private sendCommand(
    command: DaemonCommand
  ): Effect.Effect<DaemonResponse, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      if (!(this.socket && this.responseQueue)) {
        return yield* Effect.fail(
          new DaemonCommandError("Not connected to daemon")
        );
      }

      // Send command
      this.socket.write(serializeCommand(command));

      // Wait for response
      const response = yield* Queue.take(this.responseQueue);

      if (response.type === "error") {
        return yield* Effect.fail(new DaemonCommandError(response.message));
      }

      return response;
    });
  }

  /**
   * Start a new session.
   */
  startSession(
    sessionId: string,
    config: LoopConfig
  ): Effect.Effect<void, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      const response = yield* this.sendCommand({
        type: "start",
        sessionId,
        config,
      });

      if (response.type !== "ok") {
        return yield* Effect.fail(
          new DaemonCommandError(`Unexpected response: ${response.type}`)
        );
      }
    });
  }

  /**
   * Pause a session.
   */
  pauseSession(
    sessionId: string
  ): Effect.Effect<void, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      const response = yield* this.sendCommand({
        type: "pause",
        sessionId,
      });

      if (response.type !== "ok") {
        return yield* Effect.fail(
          new DaemonCommandError(`Unexpected response: ${response.type}`)
        );
      }
    });
  }

  /**
   * Cancel a session.
   */
  cancelSession(
    sessionId: string
  ): Effect.Effect<void, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      const response = yield* this.sendCommand({
        type: "cancel",
        sessionId,
      });

      if (response.type !== "ok") {
        return yield* Effect.fail(
          new DaemonCommandError(`Unexpected response: ${response.type}`)
        );
      }
    });
  }

  /**
   * List all sessions.
   */
  listSessions(): Effect.Effect<
    readonly SessionInfo[],
    DaemonCommandError,
    never
  > {
    return Effect.gen(this, function* () {
      const response = yield* this.sendCommand({ type: "list" });

      if (response.type !== "sessions") {
        return yield* Effect.fail(
          new DaemonCommandError(`Unexpected response: ${response.type}`)
        );
      }

      return response.sessions;
    });
  }

  /**
   * Get session status.
   */
  getSessionStatus(
    sessionId: string
  ): Effect.Effect<SessionInfo, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      const response = yield* this.sendCommand({
        type: "status",
        sessionId,
      });

      if (response.type !== "session_status") {
        return yield* Effect.fail(
          new DaemonCommandError(`Unexpected response: ${response.type}`)
        );
      }

      return response.session;
    });
  }

  /**
   * Subscribe to session events.
   */
  subscribeToSession(
    sessionId: string
  ): Effect.Effect<void, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      const response = yield* this.sendCommand({
        type: "subscribe",
        sessionId,
      });

      if (response.type !== "ok") {
        return yield* Effect.fail(
          new DaemonCommandError(`Unexpected response: ${response.type}`)
        );
      }
    });
  }

  /**
   * Unsubscribe from session events.
   */
  unsubscribeFromSession(
    sessionId: string
  ): Effect.Effect<void, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      const response = yield* this.sendCommand({
        type: "unsubscribe",
        sessionId,
      });

      if (response.type !== "ok") {
        return yield* Effect.fail(
          new DaemonCommandError(`Unexpected response: ${response.type}`)
        );
      }
    });
  }

  /**
   * Request daemon shutdown.
   */
  shutdown(): Effect.Effect<void, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      yield* this.sendCommand({ type: "shutdown" });
    });
  }

  /**
   * Get the daemon's build time version.
   * Used to check if the daemon is running stale code.
   */
  getVersion(): Effect.Effect<number, DaemonCommandError, never> {
    return Effect.gen(this, function* () {
      const response = yield* this.sendCommand({ type: "version" });

      if (response.type !== "version") {
        return yield* Effect.fail(
          new DaemonCommandError(`Unexpected response: ${response.type}`)
        );
      }

      return response.buildTime;
    });
  }

  /**
   * Get a stream of domain events for a specific session.
   * The stream filters events by sessionId.
   */
  getEventStream(
    sessionId: string
  ): Stream.Stream<DomainEvent, DaemonCommandError, never> {
    return Stream.fromEffect(
      Effect.gen(this, function* () {
        if (!this.domainEventQueue) {
          return yield* Effect.fail(
            new DaemonCommandError("Not connected to daemon")
          );
        }
        return this.domainEventQueue;
      })
    ).pipe(
      Stream.flatMap((queue) =>
        Stream.fromQueue(queue).pipe(
          Stream.filter((event) => event.sessionId === sessionId),
          Stream.map((event) => event.event)
        )
      )
    );
  }

  /**
   * Get a stream of session status events for a specific session.
   * Emits when the session status changes (running -> completed, etc).
   */
  getStatusStream(
    sessionId: string
  ): Stream.Stream<SessionStatus, DaemonCommandError, never> {
    return Stream.fromEffect(
      Effect.gen(this, function* () {
        if (!this.statusEventQueue) {
          return yield* Effect.fail(
            new DaemonCommandError("Not connected to daemon")
          );
        }
        return this.statusEventQueue;
      })
    ).pipe(
      Stream.flatMap((queue) =>
        Stream.fromQueue(queue).pipe(
          Stream.filter((event) => event.sessionId === sessionId),
          Stream.map((event) => event.status)
        )
      )
    );
  }

  /**
   * Get a stream of all domain events (for monitoring).
   */
  getAllEvents(): Stream.Stream<DaemonDomainEvent, DaemonCommandError, never> {
    return Stream.fromEffect(
      Effect.gen(this, function* () {
        if (!this.domainEventQueue) {
          return yield* Effect.fail(
            new DaemonCommandError("Not connected to daemon")
          );
        }
        return this.domainEventQueue;
      })
    ).pipe(Stream.flatMap((queue) => Stream.fromQueue(queue)));
  }

  /**
   * Detach from a session and disconnect.
   * This unsubscribes from the session and closes the connection.
   * The session continues running in the daemon.
   */
  detach(sessionId: string): Effect.Effect<void, never, never> {
    return Effect.gen(this, function* () {
      if (this.isConnected()) {
        yield* this.unsubscribeFromSession(sessionId).pipe(Effect.ignore);
        yield* this.disconnect();
      }
    });
  }
}

/**
 * Create a new daemon client.
 */
export function createDaemonClient(): DaemonClient {
  return new DaemonClient();
}

/**
 * Run a session via the daemon.
 * Connects to daemon, starts session, returns event stream.
 */
export function runSessionViaDaemon(
  sessionId: string,
  config: LoopConfig
): Effect.Effect<
  Stream.Stream<DomainEvent, never, never>,
  DaemonConnectionError | DaemonCommandError,
  never
> {
  return Effect.gen(function* () {
    const client = createDaemonClient();

    // Connect to daemon
    yield* client.connect();

    // Start session
    yield* client.startSession(sessionId, config);

    // Return event stream
    // Note: The stream will need to be consumed and the client
    // should be disconnected when done
    return client
      .getEventStream(sessionId)
      .pipe(Stream.catchAll(() => Stream.empty));
  });
}
