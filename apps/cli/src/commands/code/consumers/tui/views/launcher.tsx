import { type ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { Result } from "better-result";
import { Effect } from "effect";
import { createEffect, createSignal, For, Show } from "solid-js";
import type { SessionInfo } from "../../../daemon/protocol.js";
import { Logo, SplitBorder } from "../components/index.js";
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
 * Provider config for display badges.
 */
interface ProviderDisplay {
  readonly label: string;
  readonly color: string;
}

/**
 * Get provider display config for a session.
 */
function getProviderDisplay(
  provider: string | undefined,
  themeColors: { warning: string; info: string; success: string }
): ProviderDisplay | undefined {
  if (!provider) {
    return undefined;
  }
  const configs: Record<string, ProviderDisplay> = {
    claude: { label: "CLAUDE", color: themeColors.warning },
    cursor: { label: "CURSOR", color: themeColors.info },
    opencode: { label: "OPENCODE", color: themeColors.success },
  };
  return configs[provider];
}

/**
 * Get the color for task progress text.
 */
function getTaskProgressColor(
  done: number,
  total: number,
  selected: boolean,
  themeColors: { success: string; textDim: string; textMuted: string }
): string {
  if (done === total && total > 0) {
    return themeColors.success;
  }
  return selected ? themeColors.textDim : themeColors.textMuted;
}

/**
 * View mode for the launcher.
 */
type ViewMode = "sessions" | "new_task_input";

/**
 * Hint definition for footer.
 */
interface HintDef {
  readonly key: string;
  readonly description: string;
}

/**
 * Hint component for keyboard shortcuts.
 */
function Hint(props: HintDef) {
  const { theme } = useTheme();

  return (
    <box flexDirection="row">
      <text attributes={TextAttributes.BOLD} fg={theme.accent}>
        {props.key}
      </text>
      <text fg={theme.textMuted}>{` ${props.description}`}</text>
    </box>
  );
}

/**
 * Dot separator between hints.
 */
function HintSep() {
  const { theme } = useTheme();
  return <text fg={theme.textGhost}>{" · "}</text>;
}

/**
 * Session row component for the launcher list.
 */
function SessionRow(props: {
  session: SessionInfo;
  isSelected: boolean;
  dimensions: { width: number; height: number };
}) {
  const { theme, symbols } = useTheme();
  const session = props.session;
  const status = (() => {
    switch (session.status) {
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
  })();
  const provider = getProviderDisplay(session.provider, theme);
  const hasIteration =
    session.iteration !== undefined && session.maxIterations !== undefined;
  const hasTasks =
    session.taskDone !== undefined && session.taskTotal !== undefined;
  const sepColor = props.isSelected ? theme.textMuted : theme.textGhost;

  return (
    <box
      backgroundColor="transparent"
      border={props.isSelected ? ["left"] : undefined}
      borderColor={props.isSelected ? theme.borderActive : undefined}
      flexDirection="column"
      paddingBottom={1}
      paddingLeft={2}
    >
      {/* Line 1: status icon + task name + relative time */}
      <box flexDirection="row" height={1}>
        <text fg={status.color}>{`${status.icon} `}</text>
        <text fg={props.isSelected ? theme.text : theme.textDim}>
          {truncate(
            session.displayName ?? session.task ?? session.sessionId,
            props.dimensions.width - 30
          )}
        </text>
        <box flexGrow={1} />
        <Show when={session.startedAt}>
          <text fg={theme.textMuted}>
            {" "}
            {formatRelativeTime(new Date(session.startedAt).toISOString())}
          </text>
        </Show>
        <text> </text>
      </box>

      {/* Line 2: provider + iteration + task progress */}
      <box flexDirection="row" height={1} paddingLeft={2}>
        <Show when={provider}>
          <text attributes={TextAttributes.BOLD} fg={provider?.color}>
            {provider?.label}
          </text>
          <text fg={sepColor}> </text>
        </Show>
        <Show when={hasIteration}>
          <Show when={provider}>
            <text fg={sepColor}>{`${symbols.dot} `}</text>
          </Show>
          <text
            fg={props.isSelected ? theme.textDim : theme.textMuted}
          >{`iter ${session.iteration}/${session.maxIterations}`}</text>
        </Show>
        <Show when={hasTasks}>
          <Show when={provider || hasIteration}>
            <text fg={sepColor}>{` ${symbols.dot} `}</text>
          </Show>
          <text
            fg={getTaskProgressColor(
              session.taskDone as number,
              session.taskTotal as number,
              props.isSelected,
              theme
            )}
          >{`${session.taskDone}/${session.taskTotal} tasks`}</text>
        </Show>
      </box>

      {/* Line 3: last activity */}
      <Show when={session.lastActivity}>
        <box flexDirection="row" height={1} paddingLeft={2}>
          <text fg={props.isSelected ? theme.textMuted : theme.textGhost}>
            {truncate(
              session.lastActivity as string,
              props.dimensions.width - 8
            )}
          </text>
        </box>
      </Show>

      {/* Line 4: branch name + PR indicator + status */}
      <Show when={session.branchName || session.prUrl}>
        <box flexDirection="row" height={1} paddingLeft={2}>
          <Show when={session.branchName}>
            <text fg={theme.textGhost}>{session.branchName}</text>
          </Show>
          <Show when={session.prUrl}>
            <text fg={theme.textGhost}> </text>
            <text fg={theme.info}>PR</text>
          </Show>
          <text fg={theme.textGhost}>{` ${symbols.dot} `}</text>
          <text fg={theme.textGhost}>{session.status}</text>
        </box>
      </Show>
    </box>
  );
}

/**
 * Height of the header chrome (logo + paddingTop).
 */
const LOGO_HEIGHT = 6;
const HEADER_PADDING_TOP = 1;
const SPLIT_BORDER_HEIGHT = 1;
const CREATE_NEW_HEIGHT = 2;
const CHROME_HEIGHT =
  LOGO_HEIGHT +
  HEADER_PADDING_TOP +
  SPLIT_BORDER_HEIGHT +
  CREATE_NEW_HEIGHT +
  SPLIT_BORDER_HEIGHT;

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
  const [scrollboxRef, setScrollboxRef] = createSignal<
    ScrollBoxRenderable | undefined
  >(undefined);

  // Auto-scroll to keep the selected session visible
  const SESSION_ROW_HEIGHT = 4;
  createEffect(() => {
    const ref = scrollboxRef();
    const idx = selectedIndex();
    if (ref && idx > 0) {
      const sessionIdx = idx - 1;
      const scrollHeight = dimensions().height - CHROME_HEIGHT;
      const targetTop = sessionIdx * SESSION_ROW_HEIGHT;
      const targetBottom = targetTop + SESSION_ROW_HEIGHT;
      if (targetBottom > ref.scrollTop + scrollHeight) {
        ref.scrollTop = targetBottom - scrollHeight;
      } else if (targetTop < ref.scrollTop) {
        ref.scrollTop = targetTop;
      }
    } else if (ref && idx === 0) {
      ref.scrollTop = 0;
    }
  });

  // Load sessions on mount
  const loadSessions = async () => {
    setLoading(true);
    const result = await Result.tryPromise(() =>
      Effect.runPromise(daemon.listSessions())
    );
    result.match({
      ok: (data) => {
        const enriched: SessionInfo[] = data.map((session) => ({
          ...session,
        }));
        setSessions(enriched);

        // Focus the session we navigated back from
        const routeData = route.data;
        if (routeData.type === "launcher" && routeData.focusSessionId) {
          const focusIdx = enriched.findIndex(
            (s) => s.sessionId === routeData.focusSessionId
          );
          if (focusIdx >= 0) {
            setSelectedIndex(focusIdx + 1); // +1 for "Create new session" row
          }
        }
      },
      err: (e) => toast.error(e),
    });
    setLoading(false);
  };

  // Initial load
  loadSessions();

  // Get selected session
  const getSelectedSession = (): SessionInfo | undefined => {
    const idx = selectedIndex();
    if (idx === 0) {
      return undefined;
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
    const maxIndex = sessions().length;

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
          setViewMode("new_task_input");
        } else {
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

    if (session.prUrl) {
      openUrl(session.prUrl);
      toast.show({
        variant: "info",
        message: "Opening PR in browser...",
      });
      return;
    }

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
    if (evt.ctrl && evt.name === "c") {
      setViewMode("sessions");
      setTaskInput("");
      return;
    }

    if (evt.name === "escape") {
      setViewMode("sessions");
      setTaskInput("");
      return;
    }

    if (evt.name === "return" && !evt.shift) {
      const task = taskInput().trim();
      if (task) {
        route.toNew(task);
      }
    }
  };

  // Footer hints
  const getFooterHints = (): HintDef[] => {
    const base: HintDef[] = [
      { key: "j/k", description: "navigate" },
      { key: "Enter", description: "select" },
      { key: "n", description: "new" },
      { key: "r", description: "refresh" },
    ];

    const session = getSelectedSession();
    if (prCreating()) {
      return [...base, { key: "...", description: "creating PR" }];
    }
    if (session?.prUrl) {
      return [
        ...base,
        { key: "o", description: "open PR" },
        { key: "Esc", description: "quit" },
      ];
    }
    if (
      session &&
      (session.status === "completed" || session.status === "failed") &&
      session.branchName
    ) {
      return [
        ...base,
        { key: "o", description: "create PR" },
        { key: "Esc", description: "quit" },
      ];
    }
    return [...base, { key: "Esc", description: "quit" }];
  };

  const scrollHeight = () => Math.max(0, dimensions().height - CHROME_HEIGHT);

  return (
    <box flexDirection="column" height="100%" width="100%">
      {/* Header area with logo */}
      <box
        backgroundColor="transparent"
        flexDirection="column"
        paddingLeft={2}
        paddingTop={1}
        width="100%"
      >
        <Show
          fallback={
            <box height={1}>
              <text attributes={TextAttributes.BOLD} fg={theme.brand}>
                NEW SESSION
              </text>
            </box>
          }
          when={viewMode() === "sessions"}
        >
          <Logo />
        </Show>
      </box>

      {/* Separator with session count + cwd */}
      <SplitBorder width={dimensions().width}>
        <box flexDirection="row" paddingLeft={1}>
          <Show when={viewMode() === "sessions"}>
            <text fg={theme.accent}>{`${symbols.dot} `}</text>
            <text fg={theme.textDim}>
              {`${sessions().length} session${sessions().length !== 1 ? "s" : ""}`}
            </text>
          </Show>
        </box>
        <box flexGrow={1} />
      </SplitBorder>

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
            backgroundColor="transparent"
            border={selectedIndex() === 0 ? ["left"] : undefined}
            borderColor={selectedIndex() === 0 ? theme.borderActive : undefined}
            flexDirection="column"
            paddingLeft={2}
            paddingTop={1}
          >
            <text fg={selectedIndex() === 0 ? theme.accent : theme.text}>
              {`${symbols.diamond} Create new session`}
            </text>
          </box>

          {/* Sessions list in scrollbox */}
          <scrollbox
            height={scrollHeight()}
            ref={setScrollboxRef}
            scrollY={true}
            width={dimensions().width}
          >
            <box flexDirection="column" width={dimensions().width - 2}>
              <For each={sessions()}>
                {(session, index) => (
                  <SessionRow
                    dimensions={dimensions()}
                    isSelected={selectedIndex() === index() + 1}
                    session={session}
                  />
                )}
              </For>

              <Show when={sessions().length === 0}>
                <box paddingLeft={2} paddingTop={1}>
                  <text fg={theme.textMuted}>No sessions yet</text>
                </box>
              </Show>
            </box>
          </scrollbox>
        </Show>

        <Show when={viewMode() === "new_task_input"}>
          <box flexDirection="column" paddingLeft={2} paddingTop={1}>
            <text fg={theme.textDim}>
              Enter task description (Shift+Enter for newline, Enter to submit,
              Esc to cancel):
            </text>
            <box
              borderColor={theme.borderActive}
              borderStyle="single"
              height={dimensions().height - 12}
              marginTop={1}
              width={dimensions().width - 6}
            >
              <textarea
                backgroundColor={theme.backgroundElement}
                focused={true}
                height={dimensions().height - 14}
                initialValue={taskInput()}
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
      <SplitBorder width={dimensions().width}>
        <Show
          fallback={
            <box flexDirection="row" paddingLeft={1}>
              <Hint description="submit" key="Enter" />
              <HintSep />
              <Hint description="newline" key="Shift+Enter" />
              <HintSep />
              <Hint description="cancel" key="Esc" />
            </box>
          }
          when={viewMode() === "sessions"}
        >
          <box flexGrow={1} />
          <box flexDirection="row" paddingRight={1}>
            <For each={getFooterHints()}>
              {(hint, index) => (
                <>
                  <Show when={index() > 0}>
                    <HintSep />
                  </Show>
                  <Hint description={hint.description} key={hint.key} />
                </>
              )}
            </For>
          </box>
        </Show>
      </SplitBorder>
    </box>
  );
}
