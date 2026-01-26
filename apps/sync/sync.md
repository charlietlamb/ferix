# Plan: `ferix sync` - Auto-Install Skills from Dependencies

## Goal
Create a CLI command `ferix sync` that:
1. Scans package.json for dependencies
2. Resolves each package to its GitHub org (via Convex cache)
3. Finds skill repositories for those orgs (via Convex `directories` table)
4. Installs the skills using `npx skills add`

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Monorepo Structure                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  apps/sync/                    apps/code/                apps/server/        │
│  ├── src/                      ├── src/                  └── convex/         │
│  │   ├── index.ts (export)     │   └── index.ts              ├── schema.ts   │
│  │   ├── resolve-orgs.ts       │       imports from          ├── packageOrg.ts│
│  │   ├── find-skills.ts        │       @ferix/sync           └── directories.ts│
│  │   └── install-skills.ts     │                                             │
│  └── package.json              │                                             │
│      name: @ferix/sync         │                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Separation of Concerns:**
- `apps/sync` - Core sync logic (resolve orgs, find skills, install) - can be used standalone or imported
- `apps/code` - Imports and integrates sync as a subcommand
- `apps/server` - Convex backend with cache table and queries

---

## Implementation Plan

### Part 1: Create apps/sync

#### 1.1 Package Setup
**File**: `apps/sync/package.json`

```json
{
  "name": "@ferix/sync",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./resolve-orgs": "./dist/resolve-orgs.js",
    "./find-skills": "./dist/find-skills.js",
    "./install-skills": "./dist/install-skills.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "convex": "catalog:",
    "effect": "catalog:"
  },
  "devDependencies": {
    "@ferix/typescript-config": "*",
    "tsup": "catalog:",
    "typescript": "catalog:"
  }
}
```

#### 1.2 TypeScript Config
**File**: `apps/sync/tsconfig.json`

```json
{
  "extends": "@ferix/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

#### 1.3 Build Config
**File**: `apps/sync/tsup.config.ts`

```typescript
import { defineConfig } from "tsup"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/resolve-orgs.ts",
    "src/find-skills.ts",
    "src/install-skills.ts"
  ],
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: true,
  shims: true,
})
```

#### 1.4 Core Modules

**File**: `apps/sync/src/resolve-orgs.ts`
- `resolvePackageOrgs(packageNames: string[], convexUrl: string)` - Call Convex to resolve orgs
- Uses `ConvexHttpClient` to call `packageOrg:resolve` action

**File**: `apps/sync/src/find-skills.ts`
- `findSkillRepos(orgs: string[], convexUrl: string)` - Query directories for skill repos
- Uses `ConvexHttpClient` to call `directories:getByOwners` query

**File**: `apps/sync/src/install-skills.ts`
- `installSkills(repos: SkillRepo[], options: InstallOptions)` - Run `npx skills add` for each
- Options: `{ dryRun?: boolean, global?: boolean }` (default: local install)

**File**: `apps/sync/src/index.ts`
- Main export: `sync(packageJsonPath: string, options: SyncOptions)` - Full pipeline
- Re-exports individual functions for granular use

```typescript
import { Effect } from "effect"

export interface SyncOptions {
  convexUrl: string
  dryRun?: boolean
  global?: boolean
}

export interface SyncResult {
  dependencies: string[]
  orgs: string[]
  skillRepos: SkillRepo[]
  installed: string[]
}

export const sync = (
  packageJsonPath: string,
  options: SyncOptions
): Effect.Effect<SyncResult, SyncError> =>
  Effect.gen(function* () {
    // 1. Read package.json, extract deps
    // 2. resolvePackageOrgs(deps)
    // 3. findSkillRepos(orgs)
    // 4. installSkills(repos) if not dryRun
  })

export { resolvePackageOrgs } from "./resolve-orgs.js"
export { findSkillRepos } from "./find-skills.js"
export { installSkills } from "./install-skills.js"
```

---

### Part 2: Server (apps/server)

#### 2.1 Add Package Org Cache Table
**File**: `apps/server/convex/schema.ts`

```typescript
packageOrgCache: defineTable({
  packageName: v.string(),
  githubOrg: v.union(v.string(), v.null()),
  repositoryUrl: v.union(v.string(), v.null()),
  updatedAt: v.number(),
})
  .index("by_packageName", ["packageName"])
  .index("by_updatedAt", ["updatedAt"]),
```

#### 2.2 Create Package Org Functions
**File**: `apps/server/convex/packageOrg.ts` (create)

- `getBatch` - Query cached orgs, check TTL (1 week)
- `resolve` - Action: check cache → query npm for misses → update cache
- `upsert` - Internal mutation to update cache

#### 2.3 Create npm Helper
**File**: `apps/server/convex/lib/npm.ts` (create)

- `fetchNpmPackage(name)` - GET registry.npmjs.org/{name}
- `extractGitHubOrg(repoUrl)` - Parse org from URL patterns
- `resolveFromNpm(names, concurrency)` - Batch with rate limiting

#### 2.4 Add Directory Lookup
**File**: `apps/server/convex/directories.ts` (modify)

```typescript
export const getByOwners = query({
  args: { owners: v.array(v.string()) },
  handler: async (ctx, { owners }) => {
    const results = []
    for (const owner of owners) {
      const dirs = await ctx.db
        .query("directories")
        .filter((q) => q.eq(q.field("owner"), owner))
        .collect()
      results.push(...dirs.map(d => ({ owner: d.owner, repo: d.repo, githubUrl: d.githubUrl })))
    }
    return results
  },
})
```

---

### Part 3: Integrate into apps/code

#### 3.1 Add Dependency
**File**: `apps/code/package.json`

```json
{
  "dependencies": {
    "@ferix/sync": "*"
  }
}
```

#### 3.2 Add CLI Command
**File**: `apps/code/src/index.ts` (modify)

```typescript
import { sync } from "@ferix/sync"

program
  .command("sync")
  .description("Discover and install skills based on your dependencies")
  .option("-p, --path <path>", "Path to package.json", "./package.json")
  .option("-d, --dry-run", "List skills without installing")
  .option("-g, --global", "Install globally instead of project-level")
  .action(async (options) => {
    const result = await Effect.runPromise(
      sync(options.path, {
        convexUrl: CONVEX_URL,
        dryRun: options.dryRun,
        global: options.global ?? false,  // Default: local install
      })
    )
    // Output results
  })
```

---

## Files to Create/Modify

### apps/sync (new)
| File | Action |
|------|--------|
| `package.json` | Create |
| `tsconfig.json` | Create |
| `tsup.config.ts` | Create |
| `src/index.ts` | Create - main export |
| `src/resolve-orgs.ts` | Create - Convex org resolution |
| `src/find-skills.ts` | Create - skill repo lookup |
| `src/install-skills.ts` | Create - npx skills add |
| `src/types.ts` | Create - shared types |
| `src/errors.ts` | Create - error definitions |

### apps/server
| File | Action |
|------|--------|
| `convex/schema.ts` | Modify - add `packageOrgCache` table |
| `convex/packageOrg.ts` | Create - cache + resolve action |
| `convex/lib/npm.ts` | Create - npm registry helpers |
| `convex/directories.ts` | Modify - add `getByOwners` query |

### apps/code
| File | Action |
|------|--------|
| `package.json` | Modify - add `@ferix/sync` dependency |
| `src/index.ts` | Modify - add `sync` command |

---

## Verification

1. **apps/sync**: `bun run build` - verify builds without errors
2. **apps/server**: `npx convex dev` - verify schema deploys
3. **apps/code**: `bun install` - verify workspace resolution
4. **Root**: `bun lint && bun format`
5. **apps/code**: `bun test`
6. **E2E**: `ferix sync --dry-run` - verify output
7. **E2E**: `ferix sync` - verify skills install

---

## Example Output

```bash
$ ferix sync --dry-run

Scanning package.json...
Found 127 dependencies

Resolving GitHub organizations...
├── 89 from cache
├── 38 queried from npm
└── 67 unique orgs found

Checking for skill repositories...
Found 3 skill repos for your dependencies:

  effect-ts/skills     (from: effect, @effect/schema, @effect/platform)
  vercel/skills        (from: next, @vercel/og, @vercel/analytics)
  TanStack/skills      (from: @tanstack/react-query)

Run without --dry-run to install these skills.

$ ferix sync

Installing skills...
✓ effect-ts/skills installed locally
✓ vercel/skills installed locally
✓ TanStack/skills installed locally

Done! 3 skill repositories installed.
```
