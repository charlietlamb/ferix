import type { ScrollBoxRenderable } from "@opentui/core";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import { StyledLine } from "../../../components/index.js";
import { useTheme } from "../../../context/index.js";
import { styleFerixTags } from "../../../tags/index.js";

interface LogsViewProps {
  readonly outputLines: readonly string[];
  readonly scrollOffset: number;
  readonly userScrolled: boolean;
  readonly height: number;
  readonly width: number;
}

/**
 * Single log line component.
 * Extracted to avoid reactivity issues with styleFerixTags inside For callback.
 */
function LogLine(props: { readonly line: string; readonly width: number }) {
  const chunks = () => styleFerixTags(props.line || " ", props.width);

  return (
    <box paddingLeft={1}>
      <StyledLine chunks={chunks()} maxWidth={props.width} />
    </box>
  );
}

/**
 * Logs view component.
 * Displays scrollable output lines with auto-scroll behavior and ferix tag styling.
 */
export function LogsView(props: LogsViewProps) {
  const { theme } = useTheme();

  const [scrollboxRef, setScrollboxRef] = createSignal<
    ScrollBoxRenderable | undefined
  >(undefined);

  // Calculate the total content height
  const totalLines = () => props.outputLines.length;
  const maxScroll = () => Math.max(0, totalLines() - props.height);

  // Auto-scroll when new content arrives and user hasn't scrolled
  createEffect(
    on(
      () => props.outputLines.length,
      () => {
        const ref = scrollboxRef();
        if (!props.userScrolled && ref) {
          ref.scrollTop = maxScroll();
        }
      }
    )
  );

  // Update scroll position when scrollOffset changes from parent
  createEffect(() => {
    const ref = scrollboxRef();
    if (ref) {
      ref.scrollTop = props.scrollOffset;
    }
  });

  // Available width for content (accounting for scrollbox padding)
  const contentWidth = () => props.width - 2;

  return (
    <scrollbox
      height={props.height}
      ref={setScrollboxRef}
      scrollY={true}
      width={props.width}
    >
      <box flexDirection="column" width={contentWidth()}>
        <Show
          fallback={
            <box paddingLeft={2} paddingTop={1}>
              <text fg={theme.textMuted}>Waiting for output...</text>
            </box>
          }
          when={props.outputLines.length > 0}
        >
          <For each={props.outputLines}>
            {(line) => <LogLine line={line} width={contentWidth()} />}
          </For>
        </Show>
      </box>
    </scrollbox>
  );
}
