/**
 * Keypress handling utilities
 */

import { UserCancelledError } from "../../types/errors.js";
import { disableRawMode, enableRawMode } from "./raw-mode.js";

/**
 * Wait for a single keypress and return the key
 * Throws UserCancelledError on Ctrl+C
 */
function waitForKeypress(): Promise<string> {
  return new Promise((resolve, reject) => {
    enableRawMode();

    const onKey = (key: string) => {
      disableRawMode();
      process.stdin.removeListener("data", onKey);

      // Ctrl+C - throw cancellation error
      if (key === "\x03") {
        reject(new UserCancelledError());
        return;
      }

      resolve(key);
    };

    process.stdin.once("data", onKey);
  });
}

/**
 * Wait for any keypress (ignoring the actual key value)
 * Throws UserCancelledError on Ctrl+C
 */
export function waitForAnyKey(): Promise<void> {
  return waitForKeypress().then(() => undefined);
}
