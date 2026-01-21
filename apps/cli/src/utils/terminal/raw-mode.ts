/**
 * Terminal raw mode utilities for handling stdin
 */

/**
 * Enable raw mode on stdin
 */
export function enableRawMode(): void {
  process.stdin.setRawMode?.(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
}

/**
 * Disable raw mode on stdin
 */
export function disableRawMode(): void {
  process.stdin.setRawMode?.(false);
  process.stdin.pause();
}
