import { useTheme } from "../../context/index.js";
import { truncate } from "../../util/text.js";

interface TaskBarProps {
  readonly task: string;
  readonly width: number;
}

/**
 * Task bar component.
 * Shows the current task description with accent left border and diamond icon.
 * Uses backgroundElement for visual distinction from status bar.
 */
export function TaskBar(props: TaskBarProps) {
  const { theme, symbols } = useTheme();

  const cleanTask = () => props.task.replace(/\s+/g, " ").trim();
  const maxWidth = () => props.width - 6;

  return (
    <box
      backgroundColor="transparent"
      border={["left"]}
      borderColor={theme.borderActive}
      flexDirection="row"
      height={1}
      paddingLeft={1}
      width={props.width}
    >
      <text fg={theme.accent}>{`${symbols.diamond} `}</text>
      <text fg={theme.text}>{truncate(cleanTask(), maxWidth())}</text>
    </box>
  );
}
