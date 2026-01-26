import { renderTaskDetailView } from "../task-detail.js";
import { viewRendererRegistry } from "./registry.js";

viewRendererRegistry.register({
  mode: "detail",
  render: (state, height, width) => renderTaskDetailView(state, height, width),
});
