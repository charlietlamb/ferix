import { sessionName } from "../primitives.js";
import { tagRendererRegistry } from "../registry.js";

/**
 * Session name handler.
 * Renders the session name with styling.
 */
tagRendererRegistry.register({
  pattern: /<ferix:session-name>([^<]+)<\/ferix:session-name>/g,
  render: (m, w) => sessionName(m[1] ?? "", w),
});
