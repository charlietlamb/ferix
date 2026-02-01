import { colors, symbols } from "../../render/primitives.js";
import { tagRendererRegistry } from "../registry.js";

// Session name tag - renders as styled banner
tagRendererRegistry.register({
  pattern: /<ferix:session-name>([^<]+)<\/ferix:session-name>/g,
  render: (m) => {
    const name = m[1] ?? "";
    return `${colors.brand(symbols.arrow)} ${colors.muted(name)}`;
  },
});
