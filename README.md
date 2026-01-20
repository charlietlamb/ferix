# Ferix

A centralized hub for discovering, sharing, and managing AI agent skills and prompts. Ferix allows users to share skills (prompts for AI agents like Claude Code, Cursor, etc.) and sync GitHub repositories containing prompt collections.

## Features

- **Skill Discovery** - Browse and search skills, subagents, and rules for AI coding assistants
- **Repository Sync** - Connect GitHub repositories to automatically sync and share prompt collections
- **Tagging System** - Organize prompts by language, framework, and technology
- **User Profiles** - Track your created and saved prompts
- **Real-time Updates** - Instant updates powered by Convex

## Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TailwindCSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - UI component library
- **[TanStack Form](https://tanstack.com/form/)** - Type-safe form management
- **[next-intl](https://next-intl-docs.vercel.app/)** - Internationalization

### Backend
- **[Convex](https://convex.dev/)** - Real-time backend with database, file storage, and serverless functions
- **[Better Auth](https://better-auth.com/)** - Authentication library

### Tooling
- **[Bun](https://bun.sh/)** - JavaScript runtime and package manager
- **[Turborepo](https://turbo.build/)** - Monorepo build system
- **[Ultracite](https://ultracite.ai/)** - Unified linting and formatting (Biome)
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

## Project Structure

```
ferix/
├── apps/
│   ├── web/          # Next.js frontend
│   └── server/       # Convex backend
├── packages/
│   ├── ui/           # Shared UI components
│   ├── i18n/         # Internationalization
│   ├── env/          # Environment configuration
│   └── notifications/ # Email notifications
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Convex CLI](https://docs.convex.dev/getting-started)

### Installation

```bash
# Clone the repository
git clone https://github.com/charlielamb/ferix.git
cd ferix

# Install dependencies
bun install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env.local
```

### Development

```bash
# Start Convex development server
cd apps/server && npx convex dev

# In another terminal, start the Next.js dev server
bun run dev
```

### Linting & Formatting

This project uses [Ultracite](https://ultracite.ai/) for unified linting and formatting via Biome.

```bash
# Run linter
bun run lint

# Format code
bun run format
```

## Deployment

### Convex (Backend)

```bash
# Deploy to production
npx convex deploy

# Run migrations (if needed)
npx convex run migrations:runAllMigrations --prod
```

### Vercel (Frontend)

1. Connect your repository to [Vercel](https://vercel.com/)
2. Set the root directory to `apps/web`
3. Add the required environment variables (see below)

## Environment Variables

### Frontend (`apps/web/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL (e.g., `https://your-deployment.convex.cloud`) | Yes |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex site URL (e.g., `https://your-deployment.convex.site`) | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (e.g., `http://localhost:3003` for dev) | Yes |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key | No |

### Backend (`apps/server/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `CONVEX_DEPLOYMENT` | Convex deployment identifier (auto-generated) | Yes |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth (min 32 chars) | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | Yes |
| `GITHUB_TOKEN` | GitHub Personal Access Token (for repo sync) | Yes |
| `FRONTEND_URL` | Frontend URL (must match `NEXT_PUBLIC_SITE_URL`) | Yes |
| `RESEND_API_KEY` | Resend API key for emails | No |

### Setting up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the callback URL to `{FRONTEND_URL}/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your env file

### Setting up GitHub Token

1. Go to [GitHub Tokens](https://github.com/settings/tokens)
2. Generate a new token (classic) with `repo` scope
3. Copy the token to `GITHUB_TOKEN`

## Convex Best Practices

This project follows [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/):

- Argument validators on all public functions
- Access control checks on mutations
- Efficient index usage (avoiding `.filter()` on queries)
- Bounded `.collect()` calls with proper limits
- Internal functions for scheduled jobs
- Proper pagination with `usePaginatedQuery`

## License

[MIT](LICENSE) - Charlie Lamb

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
