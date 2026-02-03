import { TextAttributes } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { Effect } from "effect";
import { createSignal, For, Show } from "solid-js";
import type { SessionInfo } from "../../../daemon/protocol.js";
import {
  useDaemon,
  useExit,
  useRoute,
  useTheme,
  useToast,
} from "../context/index.js";
import { openUrl } from "../util/open-url.js";
import { formatRelativeTime, truncate } from "../util/text.js";

/**
 * View mode for the launcher.
 */
type ViewMode = "sessions" | "new_task_input";

/**
 * Launcher view component.
 *
 * This is the session selector that allows users to:
 * - Browse existing sessions with enriched output preview
 * - Select a session to view
 * - Create a new session with a task
 * - Provider badge display
 * - Session status detail (elapsed time)
 */
export function LauncherView() {
  const dimensions = useTerminalDimensions();
  const daemon = useDaemon();
  const route = useRoute();
  const exit = useExit();
  const toast = useToast();
  const { theme, symbols } = useTheme();

  // Local state
  const [sessions, setSessions] = createSignal<readonly SessionInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [viewMode, setViewMode] = createSignal<ViewMode>("sessions");
  const [taskInput, setTaskInput] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [prCreating, setPrCreating] = createSignal(false);

  // Load sessions on mount
  const loadSessions = () => {
    setLoading(true);
    Effect.runPromise(daemon.listSessions())
      .then((result) => {
        // Map sessions to enriched format
        const enriched: SessionInfo[] = result.map((session) => ({
          ...session,
        }));
        setSessions(enriched);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err);
        setLoading(false);
      });
  };

  // Initial load
  loadSessions();

  // Get selected session
  const getSelectedSession = (): SessionInfo | undefined => {
    const idx = selectedIndex();
    if (idx === 0) {
      return undefined; // "Create new" is at index 0
    }
    return sessions()[idx - 1];
  };

  // Handle keyboard input
  useKeyboard((evt) => {
    if (viewMode() === "new_task_input") {
      handleInputKeyboard(evt);
    } else {
      handleSessionsKeyboard(evt);
    }
  });

  // Keyboard handler for sessions view
  const handleSessionsKeyboard = (evt: {
    name: string;
    shift?: boolean;
    ctrl?: boolean;
    key?: string;
  }) => {
    const maxIndex = sessions().length; // +1 for "Create new"

    switch (evt.name) {
      case "j":
      case "down":
        setSelectedIndex((i) => Math.min(i + 1, maxIndex));
        break;

      case "k":
      case "up":
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;

      case "g":
        if (evt.shift) {
          setSelectedIndex(maxIndex);
        } else {
          setSelectedIndex(0);
        }
        break;

      case "return":
        if (selectedIndex() === 0) {
          // "Create new" selected
          setViewMode("new_task_input");
        } else {
          // Session selected
          const session = getSelectedSession();
          if (session) {
            route.toSession(session.sessionId);
          }
        }
        break;

      case "n":
        setViewMode("new_task_input");
        break;

      case "r":
        loadSessions();
        break;

      case "o":
        handleOpenPR();
        break;

      case "escape":
        exit();
        break;

      default:
        break;
    }
  };

  // Handle "o" key - open or create PR
  const handleOpenPR = () => {
    const session = getSelectedSession();
    if (!session || prCreating()) {
      return;
    }

    // If PR already exists, open it
    if (session.prUrl) {
      openUrl(session.prUrl);
      toast.show({
        variant: "info",
        message: "Opening PR in browser...",
      });
      return;
    }

    // If session is completed with a branch, create PR
    if (
      (session.status === "completed" || session.status === "failed") &&
      session.branchName
    ) {
      setPrCreating(true);
      Effect.runPromise(daemon.createPR(session.sessionId))
        .then((prUrl) => {
          setPrCreating(false);
          openUrl(prUrl);
          toast.show({
            variant: "success",
            message: "PR created and opened in browser",
          });
          loadSessions();
        })
        .catch((err) => {
          setPrCreating(false);
          toast.error(err);
        });
      return;
    }

    toast.show({
      variant: "warning",
      message: "No PR available for this session",
    });
  };

  // Keyboard handler for input view
  const handleInputKeyboard = (evt: {
    name: string;
    shift?: boolean;
    ctrl?: boolean;
    key?: string;
  }) => {
    // Ctrl+C - cancel
    if (evt.ctrl && evt.name === "c") {
      setViewMode("sessions");
      setTaskInput("");
      return;
    }

    // Escape - cancel
    if (evt.name === "escape") {
      setViewMode("sessions");
      setTaskInput("");
      return;
    }

    // Enter without shift - submit if there's content
    if (evt.name === "return" && !evt.shift) {
      const task = taskInput().trim();
      if (task) {
        route.toNew(task);
      }
    }
  };

  // Format session status
  const getStatusIcon = (status: SessionInfo["status"]) => {
    switch (status) {
      case "running":
        return { icon: symbols.bulletFilled, color: theme.brand };
      case "completed":
        return { icon: symbols.checkmark, color: theme.success };
      case "failed":
        return { icon: symbols.cross, color: theme.error };
      case "paused":
        return { icon: symbols.bulletEmpty, color: theme.warning };
      default:
        return { icon: symbols.bulletEmpty, color: theme.textDim };
    }
  };

  return (
    <box flexDirection="column" height="100%" width="100%">
      {/* Header */}
      <box
        alignItems="center"
        backgroundColor={theme.backgroundDim}
        height={2}
        paddingLeft={2}
        width="100%"
      >
        <text attributes={TextAttributes.BOLD} fg={theme.brand}>
          {viewMode() === "sessions" ? "FERIX" : "NEW SESSION"}
        </text>
        <Show when={viewMode() === "sessions"}>
          <text fg={theme.textDim}>{" • "}</text>
          <text fg={theme.textDim}>
            {`${sessions().length} session${sessions().length !== 1 ? "s" : ""}`}
          </text>
        </Show>
      </box>

      {/* Content */}
      <box flexDirection="column" flexGrow={1} width="100%">
        <Show when={loading()}>
          <box paddingLeft={2} paddingTop={1}>
            <text fg={theme.textDim}>Loading sessions...</text>
          </box>
        </Show>

        <Show when={!loading() && viewMode() === "sessions"}>
          {/* Create new option */}
          <box
            backgroundColor={
              selectedIndex() === 0 ? theme.backgroundHighlight : undefined
            }
            flexDirection="column"
            paddingLeft={2}
            paddingTop={1}
          >
            <text fg={selectedIndex() === 0 ? theme.brand : theme.text}>
              {`${symbols.arrow} Create new session`}
            </text>
          </box>

          {/* Sessions list */}
          <For each={sessions()}>
            {(session, index) => {
              const isSelected = () => selectedIndex() === index() + 1;
              const status = getStatusIcon(session.status);
              return (
                <box
                  backgroundColor={
                    isSelected() ? theme.backgroundHighlight : undefined
                  }
                  flexDirection="column"
                  paddingLeft={2}
                >
                  {/* Main session row */}
                  <box flexDirection="row" height={1}>
                    <text fg={status.color}>{`${status.icon} `}</text>
                    <text fg={isSelected() ? theme.text : theme.textDim}>
                      {truncate(
                        session.task ?? session.sessionId,
                        dimensions().width - 30
                      )}
                    </text>
                    <box flexGrow={1} />
                    {/* Relative time from startedAt */}
                    <Show when={session.startedAt}>
                      <text fg={theme.textMuted}>
                        {" "}
                        {formatRelativeTime(
                          new Date(session.startedAt).toISOString()
                        )}
                      </text>
                    </Show>
                    <text> </text>
                  </box>
                </box>
              );
            }}
          </For>

          <Show when={sessions().length === 0}>
            <box paddingLeft={2} paddingTop={1}>
              <text fg={theme.textMuted}>No sessions yet</text>
            </box>
          </Show>
        </Show>

        <Show when={viewMode() === "new_task_input"}>
          <box flexDirection="column" paddingLeft={2} paddingTop={1}>
            <text fg={theme.textDim}>
              Enter task description (Shift+Enter for newline, Enter to submit,
              Esc to cancel):
            </text>
            <box
              borderColor={theme.border}
              borderStyle="single"
              height={dimensions().height - 8}
              marginTop={1}
              width={dimensions().width - 6}
            >
              <textarea
                backgroundColor={theme.backgroundDim}
                focused={true}
                height={dimensions().height - 10}
                onContentChange={(event) => {
                  const text =
                    typeof event === "string" ? event : String(event);
                  setTaskInput(text);
                }}
                placeholder="Describe what you want to build..."
                textColor={theme.text}
                width={dimensions().width - 8}
              />
            </box>
          </box>
        </Show>
      </box>

      {/* Footer */}
      <box
        backgroundColor={theme.backgroundDim}
        height={1}
        paddingLeft={2}
        width="100%"
      >
        <Show
          fallback={
            <text fg={theme.textDim}>
              Enter: Submit | Shift+Enter: Newline | Esc: Cancel
            </text>
          }
          when={viewMode() === "sessions"}
        >
          <text fg={theme.textDim}>
            {(() => {
              const base =
                "j/k: Navigate | Enter: Select | n: New | r: Refresh";
              const session = getSelectedSession();
              if (prCreating()) {
                return `${base} | Creating PR...`;
              }
              if (session?.prUrl) {
                return `${base} | o: Open PR | Esc: Quit`;
              }
              if (
                session &&
                (session.status === "completed" ||
                  session.status === "failed") &&
                session.branchName
              ) {
                return `${base} | o: Create PR | Esc: Quit`;
              }
              return `${base} | Esc: Quit`;
            })()}
          </text>
        </Show>
      </box>
    </box>
  );
}
