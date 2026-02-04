import { TextAttributes } from "@opentui/core";
import { Show } from "solid-js";
import type { TUIState } from "../../../domain/schemas/tui.js";
import { useTheme } from "../context/index.js";

interface GitInfoProps {
  readonly state: TUIState;
  readonly width: number;
  readonly showDivider?: boolean;
}

/**
 * Git info section showing branch and PR info.
 */
export function GitInfo(props: GitInfoProps) {
  const { theme } = useTheme();

  return (
    <Show when={props.showDivider ? props.state.gitBranch : true}>
      <box flexDirection="column" width={props.width}>
        <Show when={props.showDivider}>
          <box height={1} paddingLeft={1} width={props.width}>
            <text fg={theme.borderSubtle}>
              {"─".repeat(Math.max(0, props.width - 2))}
            </text>
          </box>
        </Show>

        <Show when={props.state.gitBranch}>
          <box flexDirection="row" height={1} paddingLeft={1}>
            <text attributes={TextAttributes.BOLD} fg={theme.accent}>
              {"▸ GIT"}
            </text>
            <text fg={theme.borderSubtle}>{" │ "}</text>
            <text fg={theme.text}>{props.state.gitBranch}</text>
            <text> </text>
            <Show
              fallback={<text fg={theme.textDim}>Not pushed</text>}
              when={props.state.gitPushed}
            >
              <text fg={theme.success}>{"●"}</text>
            </Show>
          </box>
        </Show>

        <Show when={props.state.prUrl}>
          <box flexDirection="row" height={1} paddingLeft={1}>
            <text attributes={TextAttributes.BOLD} fg={theme.accent}>
              {"▸ PR"}
            </text>
            <text fg={theme.borderSubtle}>{" │ "}</text>
            <text fg={theme.info}>{props.state.prUrl}</text>
          </box>
        </Show>
      </box>
    </Show>
  );
}
