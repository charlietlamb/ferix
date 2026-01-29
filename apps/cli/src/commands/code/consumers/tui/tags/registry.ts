/**
 * Tag renderer handler interface.
 */
interface TagHandler {
  readonly pattern: RegExp;
  readonly render: (match: RegExpMatchArray, width: number) => string;
}

/**
 * Registry for tag renderers.
 * Allows adding new tag handlers without modifying existing code.
 */
interface TagRendererRegistry {
  register(handler: TagHandler): void;
  style(line: string, width: number): string;
  getAll(): readonly TagHandler[];
}

/**
 * Creates the tag renderer registry.
 */
function createTagRendererRegistry(): TagRendererRegistry {
  const handlers: TagHandler[] = [];

  return {
    register(handler) {
      handlers.push(handler);
    },

    style(line: string, width: number): string {
      let result = line;
      for (const { pattern, render } of handlers) {
        result = result.replace(pattern, (...args) => {
          return render(args as unknown as RegExpMatchArray, width);
        });
      }
      return result;
    },

    getAll() {
      return handlers;
    },
  };
}

// Singleton registry instance
export const tagRendererRegistry = createTagRendererRegistry();
