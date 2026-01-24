import { renderOutputArea } from "../output-area.js";
import { viewRendererRegistry } from "./registry.js";

viewRendererRegistry.register({
  mode: "logs",
  render: (state, height, width) => renderOutputArea(state, height, width),
});
