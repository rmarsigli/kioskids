# KiosKids

Time management and billing platform for children's entertainment spaces (examples: trampoline parks, kids clubs). Eliminates internet dependency, human calculation errors, and cash leakage by running a full billing engine locally on a Windows kiosk and syncing passively to the cloud.

## Architecture

The system is split into two independent modules developed sequentially:

**Phase 1 — Electron Satellite (this repository)**
The desktop kiosk. Runs 100% offline. Handles check-in, check-out, automatic billing calculation, receipt printing, and WhatsApp notifications. All data is persisted locally in SQLite and queued for future sync.

**Phase 2+ — Laravel Core (separate repository, not yet started)**
Cloud backend. Manages tariff rules, financial dashboard, and multi-tenant kiosk provisioning. The Electron client pulls rules and pushes session batches when network is available.

The kiosk is built sync-ready from day one: the sync queue exists, payload shapes are locked in `src/shared/`, but the HTTP calls are deferred until Phase 2.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop engine | Electron + TypeScript (strict) |
| Renderer | React + Vite + Tailwind v4 |
| Local database | SQLite via `better-sqlite3` |
| Validation | Zod at IPC boundaries |
| Testing | Vitest (unit) + Playwright (E2E) |
| Packaging | electron-builder — Windows NSIS `.exe` |
| CI/CD | GitHub Actions |

## Process Isolation

The architecture enforces strict separation between Electron processes:

```
Renderer (React)           — pure UI, no Node.js APIs
    ↓  window.api.*        — typed contextBridge methods only
Preload                    — contextBridge definitions
    ↓  ipcRenderer.invoke
Main Process               — SQLite, file system, hardware, OS APIs
```

IPC channels follow `domain:action` naming (`db:check-in`, `hw:print-receipt`). All handlers return a typed `IpcResult<T>` envelope — raw Node errors never cross the bridge.

## Project Management

This project uses [AIPIM](https://github.com/rmarsigli/aipim) for AI-assisted task and context management.

### What AIPIM does

- Maintains a task backlog in `.project/backlog/` as Markdown files with YAML frontmatter
- Tracks task status, priority, estimates, and blockers via an event log (`events.jsonl`)
- Persists session context in `.project/context.md` so AI sessions resume correctly
- Logs architectural decisions (ADRs) in `.project/decisions/`
- Exposes an MCP server at `http://localhost:3141/mcp` for AI tool integration

### Running AIPIM

```bash
# Start the AIPIM server (MCP + web UI)
aipim ui

# Register MCP with Claude Code (run once per project)
claude mcp add --transport http aipim http://localhost:3141/mcp
```

### Starting a work session

```bash
# 1. Start AIPIM server
aipim ui

# 2. Open project in VS Code / Claude Code
# 3. AI calls get_project_context -> returns current state + next task
# 4. Review last commit
git log -1 --oneline
```

### Task workflow

```
backlog -> in-progress -> review -> done
```

Each task maps to one atomic git commit: `type(scope): description`

### Directory structure

```
.project/
  backlog/        # Active tasks: YYYY-MM-DD-TASK-XXX-name.md
  completed/      # Archived tasks: YYYY-MM-DD-TASK-XXX-name.md
  decisions/      # ADRs: YYYY-MM-DD-ADRxxx-title.md
  context.md      # Session state (current task, next action, blockers)
  docs/           # Architecture, API contracts, feature specs, roadmap
  _templates/     # Task, ADR, and context templates
```

## Dedicions

| Document | Description |
|---|---|
| [ADR001](.project/decisions/2026-03-01-ADR001-why-electron-first.md) | Why Electron is built before the cloud API |
| [ADR002](.project/decisions/2026-03-01-ADR002-why-sqlite.md) | Why SQLite + better-sqlite3 |

## Development

```bash
# Install dependencies
pnpm install

# Start dev (Electron + Vite HMR)
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint

# Package Windows installer
pnpm build
```

## Releasing

```bash
# Bump patch version, tag, and push (triggers GitHub Actions release workflow)
pnpm release
```

GitHub Actions builds the `.exe` installer and publishes it to GitHub Releases. The auto-updater on installed clients picks it up automatically.

## License

UNLICENSED — proprietary software.