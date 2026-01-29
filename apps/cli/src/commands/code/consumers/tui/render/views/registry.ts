import type { TUIState, ViewMode } from "../../../../domain/schemas/tui.js";

/**
 * View renderer interface.
 */
interface ViewRenderer {
  readonly mode: ViewMode;
  readonly render: (state: TUIState, height: number, width: number) => string[];
}

/**
 * Registry for view renderers.
 */
interface ViewRendererRegistry {
  register(renderer: ViewRenderer): void;
  render(
    mode: ViewMode,
    state: TUIState,
    height: number,
    width: number
  ): string[];
}

/**
 * Creates the view renderer registry.
 */
function createViewRendererRegistry(): ViewRendererRegistry {
  const renderers = new Map<ViewMode, ViewRenderer["render"]>();

  return {
    register(renderer) {
      renderers.set(renderer.mode, renderer.render);
    },

    render(
      mode: ViewMode,
      state: TUIState,
      height: number,
      width: number
    ): string[] {
      const renderer = renderers.get(mode);
      if (renderer) {
        return renderer(state, height, width);
      }
      // Default to empty lines
      return new Array(height).fill("");
    },
  };
}

// Singleton registry instance
export const viewRendererRegistry = createViewRendererRegistry();
