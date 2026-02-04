import { createStore } from "solid-js/store";
import { createSimpleContext } from "./helper.js";

/**
 * Route types for the TUI application.
 */
interface LauncherRoute {
  readonly type: "launcher";
  readonly focusSessionId?: string;
}

interface SessionRoute {
  readonly type: "session";
  readonly sessionId: string;
}

interface NewSessionRoute {
  readonly type: "new";
  readonly task: string;
}

export type Route = LauncherRoute | SessionRoute | NewSessionRoute;

/**
 * Route context for navigation between TUI views.
 *
 * Supports three routes:
 * - launcher: Session selector/list view
 * - session: Active session view (viewing existing session)
 * - new: Starting a new session with a task
 */
export const { use: useRoute, provider: RouteProvider } = createSimpleContext({
  name: "Route",
  init: (input: { initial?: Route }) => {
    const [store, setStore] = createStore<Route>(
      input.initial ?? { type: "launcher" }
    );

    return {
      /**
       * Get current route data.
       */
      get data() {
        return store;
      },

      /**
       * Navigate to a new route.
       */
      navigate(route: Route) {
        setStore(route);
      },

      /**
       * Navigate to launcher view.
       */
      toLauncher(focusSessionId?: string) {
        setStore({ type: "launcher", focusSessionId });
      },

      /**
       * Navigate to session view.
       */
      toSession(sessionId: string) {
        setStore({ type: "session", sessionId });
      },

      /**
       * Navigate to new session view with a task.
       */
      toNew(task: string) {
        setStore({ type: "new", task });
      },
    };
  },
});
