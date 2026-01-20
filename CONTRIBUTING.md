# Contributing to Ferix

Thank you for your interest in contributing to Ferix! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/charlietlamb/ferix.git
   cd ferix
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/server/.env.example apps/server/.env.local
   ```
   
   See [README.md](README.md#environment-variables) for details on each variable.

4. **Start development servers**
   ```bash
   bun run dev                         # Next.js dev server
   cd apps/server && npx convex dev    # Convex dev server (separate terminal)
   ```

## Code Style

### Linting & Formatting

This project uses [Ultracite](https://ultracite.ai/) for linting and formatting. Ultracite is a unified configuration for Biome that provides consistent code style.

```bash
bun run lint        # Run linter
bun run lint:fix    # Fix auto-fixable issues
```

### Code Style Guidelines

- **No inline comments** - Use JSDoc for function documentation
- **Use proper TypeScript types** - Avoid `any`, use proper Convex types
- **Import order** - Let Biome handle import sorting
- **Braces required** - Always use block statements (braces) for if/else/loops

### Convex Best Practices

When working with Convex, follow the [official best practices](https://docs.convex.dev/understanding/best-practices/):

- Use `.withIndex()` instead of `.filter()` on database queries
- Avoid unbounded `.collect()` - use `.take(limit)` or pagination
- All public functions must have an `args` validator (even if empty: `args: {}`)
- Use `internalMutation`/`internalQuery` for functions not meant to be called from the client
- Import `paginationOptsValidator` directly from `convex/server` (no barrel re-exports)

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Add tests if applicable
   - Update documentation if needed

3. **Run checks before submitting**
   ```bash
   bun run lint
   cd apps/web && npx tsc --noEmit
   ```

4. **Submit your PR**
   - Provide a clear description of your changes
   - Reference any related issues
   - Ensure CI checks pass

## Project Structure

```
ferix/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── server/       # Convex backend
├── packages/
│   └── ui/           # Shared UI components
```

## Questions?

If you have questions, feel free to open an issue or start a discussion on GitHub.
