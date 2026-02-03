import { Effect, type Stream } from "effect";
import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import type { DaemonClient } from "../../../daemon/client.js";
import type { SessionInfo, SessionStatus } from "../../../daemon/protocol.js";
import type { DomainEvent, LoopConfig } from "../../../domain/index.js";
import { createSimpleContext } from "./helper.js";

/**
 * Daemon context for TUI communication with the background daemon.
 *
 * This context wraps the DaemonClient and provides:
 * - Session management (start, pause, cancel, list)
 * - Event streaming for session updates
 * - Status tracking for sessions
 */
export const { use: useDaemon, provider: DaemonProvider } = createSimpleContext(
  {
    name: "Daemon",
    init: (input: { client: DaemonClient }) => {
      const { client } = input;

      // Track active subscriptions for cleanup
      const [store, setStore] = createStore({
        sessions: [] as readonly SessionInfo[],
        loading: false,
      });

      // Cleanup on unmount
      onCleanup(() => {
        Effect.runPromise(client.disconnect().pipe(Effect.ignore));
      });

      return {
        /**
         * The underlying daemon client.
         */
        client,

        /**
         * Check if connected to daemon.
         */
        isConnected: () => client.isConnected(),

        /**
         * List all sessions from daemon.
         */
        listSessions: (): Effect.Effect<
          readonly SessionInfo[],
          unknown,
          never
        > => {
          return client
            .listSessions()
            .pipe(
              Effect.tap((sessions) =>
                Effect.sync(() => setStore("sessions", sessions))
              )
            );
        },

        /**
         * Get current cached sessions.
         */
        get sessions() {
          return store.sessions;
        },

        /**
         * Start a new session.
         */
        startSession: (
          sessionId: string,
          config: LoopConfig
        ): Effect.Effect<void, unknown, never> => {
          return client.startSession(sessionId, config);
        },

        /**
         * Subscribe to session events.
         */
        subscribeToSession: (
          sessionId: string
        ): Effect.Effect<void, unknown, never> => {
          return client.subscribeToSession(sessionId);
        },

        /**
         * Unsubscribe from session events.
         */
        unsubscribeFromSession: (
          sessionId: string
        ): Effect.Effect<void, unknown, never> => {
          return client.unsubscribeFromSession(sessionId);
        },

        /**
         * Get event stream for a session.
         */
        getEventStream: (
          sessionId: string
        ): Stream.Stream<DomainEvent, unknown, never> => {
          return client.getEventStream(sessionId);
        },

        /**
         * Get status stream for a session.
         */
        getStatusStream: (
          sessionId: string
        ): Stream.Stream<SessionStatus, unknown, never> => {
          return client.getStatusStream(sessionId);
        },

        /**
         * Get session status.
         */
        getSessionStatus: (
          sessionId: string
        ): Effect.Effect<SessionInfo, unknown, never> => {
          return client.getSessionStatus(sessionId);
        },

        /**
         * Pause a session.
         */
        pauseSession: (
          sessionId: string
        ): Effect.Effect<void, unknown, never> => {
          return client.pauseSession(sessionId);
        },

        /**
         * Cancel a session.
         */
        cancelSession: (
          sessionId: string
        ): Effect.Effect<void, unknown, never> => {
          return client.cancelSession(sessionId);
        },

        /**
         * Create a PR for a session.
         */
        createPR: (
          sessionId: string
        ): Effect.Effect<string, unknown, never> => {
          return client.createPR(sessionId);
        },

        /**
         * Detach from a session (unsubscribe but keep running).
         */
        detach: (sessionId: string): Effect.Effect<void, never, never> => {
          return client.detach(sessionId);
        },

        /**
         * Disconnect from daemon.
         */
        disconnect: (): Effect.Effect<void, never, never> => {
          return client.disconnect();
        },
      };
    },
  }
);
