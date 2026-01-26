import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/resolve-orgs.ts",
    "src/find-skills.ts",
    "src/install-skills.ts",
  ],
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: true,
  shims: true,
});
