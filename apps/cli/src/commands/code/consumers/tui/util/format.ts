/**
 * Shared formatting utilities for TUI views.
 */

/**
 * Format duration between two timestamps as MM:SS.
 */
export function formatDuration(
  startedAt?: number,
  completedAt?: number
): string {
  if (!startedAt) {
    return "--:--";
  }
  const endTime = completedAt ?? Date.now();
  const diffMs = endTime - startedAt;
  const minutes = Math.floor(diffMs / 60_000);
  const seconds = Math.floor((diffMs % 60_000) / 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format a timestamp as HH:MM:SS.
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
