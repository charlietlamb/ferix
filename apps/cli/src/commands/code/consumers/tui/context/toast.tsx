import { TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/solid";
import { createContext, type ParentProps, Show, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { useTheme } from "./theme.js";

/**
 * Toast notification options.
 */
interface ToastOptions {
  readonly variant: "success" | "error" | "warning" | "info";
  readonly message: string;
  readonly title?: string;
  readonly duration?: number;
}

/**
 * Default toast duration in milliseconds.
 */
const DEFAULT_DURATION = 3000;

/**
 * Toast component that renders current toast notification.
 */
export function Toast() {
  const toast = useToast();
  const { theme } = useTheme();
  const dimensions = useTerminalDimensions();

  const getVariantColor = (variant: ToastOptions["variant"]) => {
    switch (variant) {
      case "success":
        return theme.success;
      case "error":
        return theme.error;
      case "warning":
        return theme.warning;
      case "info":
        return theme.info;
      default:
        return theme.info;
    }
  };

  return (
    <Show when={toast.currentToast}>
      {(current) => (
        <box
          alignItems="flex-start"
          backgroundColor={theme.backgroundDim}
          border={["left", "right"]}
          borderColor={getVariantColor(current().variant)}
          justifyContent="center"
          maxWidth={Math.min(60, dimensions().width - 6)}
          paddingBottom={1}
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          position="absolute"
          right={2}
          top={2}
        >
          <Show when={current().title}>
            <text
              attributes={TextAttributes.BOLD}
              fg={theme.text}
              marginBottom={1}
            >
              {current().title}
            </text>
          </Show>
          <text fg={theme.text} width="100%" wrapMode="word">
            {current().message}
          </text>
        </box>
      )}
    </Show>
  );
}

function init() {
  const [store, setStore] = createStore({
    currentToast: null as ToastOptions | null,
  });

  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const toast = {
    /**
     * Show a toast notification.
     */
    show(options: ToastOptions) {
      const duration = options.duration ?? DEFAULT_DURATION;
      setStore("currentToast", options);

      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      timeoutHandle = setTimeout(() => {
        setStore("currentToast", null);
      }, duration);
    },

    /**
     * Show an error toast from an Error object.
     */
    error: (err: unknown) => {
      if (err instanceof Error) {
        toast.show({
          variant: "error",
          message: err.message,
        });
        return;
      }
      toast.show({
        variant: "error",
        message: "An unknown error has occurred",
      });
    },

    /**
     * Get the current toast (if any).
     */
    get currentToast(): ToastOptions | null {
      return store.currentToast;
    },

    /**
     * Clear the current toast.
     */
    clear() {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      setStore("currentToast", null);
    },
  };

  return toast;
}

type ToastContext = ReturnType<typeof init>;

const ctx = createContext<ToastContext>();

/**
 * Toast provider component.
 */
export function ToastProvider(props: ParentProps) {
  const value = init();
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>;
}

/**
 * Hook to access the toast context.
 */
export function useToast() {
  const value = useContext(ctx);
  if (!value) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return value;
}
