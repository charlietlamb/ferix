# ferix.json Configuration System - Implementation Plan

## Overview

Add a cascading configuration system to ferix-code CLI that allows users to define default CLI options in configuration files.

**Config Priority (highest to lowest):**
1. CLI arguments (always override everything)
2. `.ferix/config.json`
3. `ferix.json`
4. `package.json` under `ferix` key

**Supported Options:** `iterations`, `verify`, `branch`, `push`, `pr`, `provider`
**Excluded:** `task` (always passed via CLI)

---

## Files to Create

### 1. `apps/code/src/domain/schemas/file-config.ts`

Effect schema for config file validation:

```typescript
import { Schema as S } from "effect";
import { ProviderNameSchema } from "./config.js";

export const FileConfigSchema = S.Struct({
  iterations: S.optional(S.Number),
  verify: S.optional(S.Array(S.String)),
  branch: S.optional(S.String),
  push: S.optional(S.Boolean),
  pr: S.optional(S.Boolean),
  provider: S.optional(ProviderNameSchema),
});

export type FileConfig = typeof FileConfigSchema.Type;
export const decodeFileConfig = S.decodeUnknown(FileConfigSchema);
```

### 2. `apps/code/src/services/config-loader.ts`

Service interface for config loading:

```typescript
export interface ConfigLoaderService {
  readonly load: () => Effect.Effect<FileConfig, ConfigLoadError>;
}

export class ConfigLoader extends Context.Tag("@ferix/ConfigLoader")<
  ConfigLoader,
  ConfigLoaderService
>() {}
```

### 3. `apps/code/src/layers/config/file-system.ts`

Cascading config loader implementation that:
- Reads `.ferix/config.json`, `ferix.json`, and `package.json`
- Validates with Effect schema
- Merges configs (higher priority wins)
- Returns empty config if no files exist (not an error)

### 4. `apps/code/src/layers/config/memory.ts`

Memory implementation for testing.

---

## Files to Modify

### 5. `apps/code/src/domain/errors.ts`

Add `ConfigLoadError`:

```typescript
export class ConfigLoadError extends Data.TaggedError("ConfigLoadError")<{
  readonly message: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}
```

Add to `FerixError` union.

### 6. `apps/code/src/domain/schemas/index.ts`

Export new schema: `export * from "./file-config.js";`

### 7. `apps/code/src/services/index.ts`

Export service: `export { ConfigLoader, type ConfigLoaderService } from "./config-loader.js";`

### 8. `apps/code/src/layers/index.ts`

Export layer: `export { FileSystemConfig } from "./config/file-system.js";`

### 9. `apps/code/src/index.ts`

Modify CLI entry point to:
1. Load config before action
2. Merge CLI args over config (CLI wins)
3. Handle CLI defaults properly (don't override config when CLI uses default)

Key merge logic:
```typescript
// CLI args override config, but check for explicit vs default values
const config: LoopConfig = {
  task,
  maxIterations: cliOptions.iterations !== "1"
    ? Number.parseInt(cliOptions.iterations, 10)
    : fileConfig.iterations ?? 1,
  verifyCommands: cliOptions.verify ?? fileConfig.verify ?? [],
  branch: cliOptions.branch ?? fileConfig.branch,
  push: cliOptions.push ?? fileConfig.push,
  pr: cliOptions.pr ?? fileConfig.pr,
  provider: cliOptions.provider !== "claude"
    ? cliOptions.provider as ProviderName
    : fileConfig.provider ?? "claude",
};
```

---

## Documentation

### 10. `README.md`

Add section after "Deployment" documenting:
- Config file locations and priority
- Example `ferix.json`
- Example `package.json` with ferix key
- All available options with types

### 11. `packages/ui/src/components/code/code-docs.tsx`

Add two new DocCells after CLI Options section:
- **Configuration**: Example ferix.json with common options
- **Config Locations**: Priority list with descriptions

### 12. `apps/web/locales/en.json`

Add translations under `code.docs`:
```json
{
  "config": "Configuration",
  "configDesc": "Create a ferix.json file to set default options",
  "configLocations": "Config Locations",
  "configLocationsDesc": "Files are checked in priority order (CLI args override all)",
  "config_priority1": "Highest priority",
  "config_priority2": "Project root",
  "config_priority3": "Lowest priority"
}
```

---

## Implementation Sequence

1. Create `file-config.ts` schema
2. Add `ConfigLoadError` to errors.ts
3. Create `config-loader.ts` service interface
4. Implement `layers/config/file-system.ts`
5. Create `layers/config/memory.ts` for testing
6. Update all index.ts exports
7. Modify CLI entry point (`index.ts`)
8. Update README.md
9. Update CodeDocs component
10. Add translations

---

## Verification

1. **Unit tests**: Config loader with various file combinations
2. **Manual testing**:
   - Create `ferix.json` with `iterations: 5` - verify it's used
   - Run with `-i 3` - verify CLI overrides config
   - Add `ferix` key to package.json - verify lowest priority
   - Create `.ferix/config.json` - verify highest priority
3. **Run linting**: `bun lint && bun format`
4. **Web docs**: Check `/code` route renders new config section

---

## Critical Files Reference

- `apps/code/src/domain/schemas/config.ts` - Existing schemas to reference
- `apps/code/src/domain/errors.ts` - Error pattern to follow
- `apps/code/src/layers/session/file-system.ts` - File I/O pattern with Effect
- `packages/ui/src/components/code/code-docs.tsx` - Docs component structure
