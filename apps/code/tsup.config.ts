import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: true,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  // Bundle workspace packages to avoid npm 404 errors when users install the CLI
  // These packages are not published to npm, so they must be inlined
  noExternal: ["@ferix/sync", "@ferix/server"],
});
