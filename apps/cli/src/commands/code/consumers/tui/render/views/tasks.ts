import { renderTasksListView } from "../tasks-list.js";
import { viewRendererRegistry } from "./registry.js";

viewRendererRegistry.register({
  mode: "tasks",
  render: (state, height, width) => renderTasksListView(state, height, width),
});
