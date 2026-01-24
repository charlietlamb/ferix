import type { ViewMode } from "../state.js";

/**
 * Key action types.
 */
export type KeyAction =
  | { readonly type: "quit" }
  | {
      readonly type: "scroll";
      readonly direction: "up" | "down";
      readonly lines: number;
    }
  | { readonly type: "scroll_to"; readonly position: "top" | "bottom" }
  | {
      readonly type: "navigate";
      readonly direction: "next" | "prev" | "first" | "last";
    }
  | { readonly type: "select" }
  | { readonly type: "switch_view"; readonly view: ViewMode }
  | { readonly type: "back" }
  | { readonly type: "mouse_wheel"; readonly delta: number }
  | { readonly type: "none" };

/**
 * Key binding configuration.
 */
export interface KeyBinding {
  readonly key: string;
  readonly action: KeyAction;
  readonly viewModes?: readonly ViewMode[];
}

/**
 * Registry for key bindings.
 */
export interface KeyBindingRegistry {
  register(binding: KeyBinding): void;
  getAction(key: string, viewMode: ViewMode): KeyAction | undefined;
  getAll(): readonly KeyBinding[];
}

/**
 * Creates the key binding registry.
 */
export function createKeyBindingRegistry(): KeyBindingRegistry {
  const bindings: KeyBinding[] = [];

  return {
    register(binding) {
      bindings.push(binding);
    },

    getAction(key: string, viewMode: ViewMode): KeyAction | undefined {
      for (const binding of bindings) {
        if (binding.key !== key) {
          continue;
        }
        // If no view modes specified, applies to all
        if (!binding.viewModes || binding.viewModes.includes(viewMode)) {
          return binding.action;
        }
      }
      return undefined;
    },

    getAll() {
      return bindings;
    },
  };
}

// Singleton registry instance
export const keyBindingRegistry = createKeyBindingRegistry();
