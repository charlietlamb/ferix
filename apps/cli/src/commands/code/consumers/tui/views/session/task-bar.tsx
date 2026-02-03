import { useTheme } from "../../context/index.js";
import { truncate } from "../../util/text.js";

interface TaskBarProps {
  readonly task: string;
  readonly width: number;
}

/**
 * Task bar component.
 * Shows the current task description.
 */
export function TaskBar(props: TaskBarProps) {
  const { theme } = useTheme();

  // Clean up task text (remove newlines, extra spaces)
  const cleanTask = () => props.task.replace(/\s+/g, " ").trim();

  // Calculate max width for task text
  const maxWidth = () => props.width - 8; // Account for borders and padding

  return (
    <box
      borderColor={theme.border}
      borderStyle="single"
      flexDirection="row"
      height={1}
      paddingLeft={1}
      width={props.width}
    >
      <text fg={theme.textDim}>{"Task: "}</text>
      <text fg={theme.text}>{truncate(cleanTask(), maxWidth())}</text>
    </box>
  );
}
