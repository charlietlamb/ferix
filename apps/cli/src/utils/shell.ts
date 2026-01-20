import { execa, type Options } from "execa";

export interface ShellResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a shell command and return structured result
 */
export async function shell(
  command: string,
  args: string[] = [],
  options?: Options
): Promise<ShellResult> {
  try {
    const result = await execa(command, args, {
      reject: false,
      ...options,
    });

    return {
      success: result.exitCode === 0,
      stdout: typeof result.stdout === "string" ? result.stdout : "",
      stderr: typeof result.stderr === "string" ? result.stderr : "",
      exitCode: result.exitCode ?? 1,
    };
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: 1,
    };
  }
}

/**
 * Execute a shell command with inherited stdio (for interactive commands)
 */
export function shellInteractive(
  command: string,
  args: string[] = []
): Promise<ShellResult> {
  return shell(command, args, { stdio: "inherit" });
}

/**
 * Check if a command exists on the system
 */
export async function commandExists(command: string): Promise<boolean> {
  const result = await shell("which", [command]);
  return result.success;
}
