import type { RGBA } from "@opentui/core";
import type { ParentProps } from "solid-js";
import { useTheme } from "../context/index.js";

interface SplitBorderProps extends ParentProps {
  readonly width: number;
  readonly backgroundColor?: RGBA;
  readonly borderColor?: RGBA;
}

/**
 * Header-style container with only left/right ┃ borders (no top/bottom).
 * Gives a clean sidebar-stripe look inspired by OpenCode.
 */
export function SplitBorder(props: SplitBorderProps) {
  const { theme, symbols } = useTheme();

  const bg = () => props.backgroundColor ?? "transparent";
  const borderClr = () => props.borderColor ?? theme.borderSubtle;
  const innerWidth = () => Math.max(0, props.width - 2);

  return (
    <box
      backgroundColor={bg()}
      flexDirection="row"
      height={1}
      width={props.width}
    >
      <text fg={borderClr()}>{symbols.splitVertical}</text>
      <box backgroundColor={bg()} flexDirection="row" width={innerWidth()}>
        {props.children}
      </box>
      <text fg={borderClr()}>{symbols.splitVertical}</text>
    </box>
  );
}
