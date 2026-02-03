/**
 * Build script for Ferix CLI using Bun.build with OpenTUI/Solid plugin.
 *
 * This replaces the tsup build for production builds that need OpenTUI support.
 */

import solidPlugin from "@opentui/solid/bun-plugin";

// biome-ignore lint/correctness/noUndeclaredVariables: Bun is a global in Bun runtime
const result = await Bun.build({
  conditions: ["browser"], // Required for OpenTUI/Solid to use browser-compatible solid-js
  entrypoints: ["./src/index.ts"],
  target: "bun",
  outdir: "./dist",
  plugins: [solidPlugin],
  external: ["@opentui/core", "@opentui/solid", "solid-js"],
  minify: false,
  sourcemap: "external",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Build succeeded!");
for (const output of result.outputs) {
  console.log(`  ${output.path}`);
}
