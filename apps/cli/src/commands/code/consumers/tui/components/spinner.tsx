import { createSignal, onCleanup, onMount } from "solid-js";
import { useTheme } from "../context/index.js";

interface SpinnerProps {
  readonly active?: boolean;
}

/**
 * Animated braille spinner component.
 * Cycles through braille frames at 80ms intervals when active.
 * Falls back to "⋯" when inactive.
 */
export function Spinner(props: SpinnerProps) {
  const { theme, spinnerFrames, SPINNER_INTERVAL_MS } = useTheme();
  const [frameIndex, setFrameIndex] = createSignal(0);

  let intervalId: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    intervalId = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % spinnerFrames.length);
    }, SPINNER_INTERVAL_MS);
  });

  onCleanup(() => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
    }
  });

  const isActive = () => props.active !== false;

  return (
    <text fg={theme.brand}>
      {isActive() ? spinnerFrames[frameIndex()] : "⋯"}
    </text>
  );
}
