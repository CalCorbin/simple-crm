# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root unless noted.

| Command | What it does |
|---|---|
| `npm run dev` | Start client (localhost:5173) and server (localhost:3000) concurrently |
| `npm run build` | Build both packages |
| `npm run typecheck` | Type-check both packages |
| `npm run lint` | Lint the client |
| `npm run test` | Run tests across all workspaces |

Workspace-scoped:
```sh
npm run test -w @simple-crm/server
npm run test -w @simple-crm/client
npx vitest run code/server/src/__tests__/opportunity.test.ts   # single test file
npm run seed -w @simple-crm/server                             # reset + reseed SQLite
```

## Architecture

npm workspaces monorepo:
- `code/client` — React 19 + Vite + Tailwind CSS + TypeScript (`@simple-crm/client`)
- `code/server` — Express 5 + TypeORM + SQLite + TypeScript (`@simple-crm/server`)

### API layer

All Express routes are in one file: `code/server/src/index.ts`. No router splitting. The Vite dev server proxies `/api/*` → `http://localhost:3000` (stripping the `/api` prefix), configured in `code/client/vite.config.ts`.

### Data model

Five TypeORM entities in `code/server/src/entity/`:

| Entity | Key fields |
|---|---|
| `Lead` | firstName, lastName, age, phoneNumber, customFields (JSON) |
| `Opportunity` | value, expectedValue, name, customFields (JSON); ManyToOne → Lead, Stage |
| `Stage` | name, status (`pending\|won\|lost`), conversionLikelihood, order, expectedValue |
| `CustomField` | name, label, entity (`lead\|opportunity`), type |
| `AppSetting` | key, value (string KV store) |

TypeORM runs with `synchronize: true` — schema auto-migrates from entity definitions on startup. There are no migration files.

### Expected value logic

`Opportunity.expectedValue = value × likelihood` where likelihood resolves as:
- `AppSetting["wonStageLikelihood"]` when `stage.status === "won"`
- `AppSetting["lostStageLikelihood"]` when `stage.status === "lost"`
- `stage.conversionLikelihood` for `pending` stages

`Stage.expectedValue` is a **denormalized running total** recalculated on every opportunity create/update/delete and when `wonStageLikelihood` or `lostStageLikelihood` settings change. Any code touching these paths must keep `Stage.expectedValue` in sync.

### Client structure

Page routing is local state in `App.tsx` (`"home" | "pipeline" | "settings"`):
- **Home** — `Leads` (list/edit) + `AddLead`
- **Pipeline** — `Pipeline` (aggregated report from `GET /pipeline`)
- **Settings** — `ManageFields`, `ManageStages`, `ManageSettings`

Shared TypeScript types are in `code/client/src/types.ts`; keep them in sync with server entities by hand (no codegen).

## Testing

Both packages use **Vitest** (`npm run test` from the root runs all suites).

### Server

- Config: `code/server/vitest.config.ts` — uses `unplugin-swc` instead of esbuild because TypeORM's decorators require `emitDecoratorMetadata`, which esbuild doesn't support. Do not add `module: { type: "commonjs" }` to the SWC config — Vitest manages the module system and that option breaks it.
- Setup: `src/__tests__/setup.ts` imports `reflect-metadata` before every test.
- Helpers: `src/__tests__/helpers.ts` exports `createTestDataSource()` (in-memory SQLite), `createLead()`, and `createStage()`. Use these in every test file — each test gets its own `DataSource` instance initialized in `beforeEach` and destroyed in `afterEach`.
- Tests: `src/__tests__/opportunity.test.ts`

### Client

- Config: `code/client/vitest.config.ts` — jsdom environment, `@vitejs/plugin-react` plugin.
- Setup: `src/test-setup.ts` imports `@testing-library/jest-dom` for DOM matchers.
- Mock axios at the top of any component test: `vi.mock("axios")` + `vi.mocked(axios).get.mockResolvedValue({ data: [] })`.
- Tests: `src/__tests__/App.test.tsx`

### Priority coverage areas

1. `Opportunity.expectedValue` calculation across all three stage statuses
2. `Stage.expectedValue` accounting when opportunities are created, updated, moved between stages, or deleted
3. `minimumOpportunityValue` enforcement on create and update
4. `wonStageLikelihood` / `lostStageLikelihood` settings changes cascading to all affected stage totals

### Test as documentation

Tests are the authoritative record of how this codebase behaves. Write them so a new developer can read the test suite and understand the system's rules without reading the implementation.

- `describe` blocks name the behavior or rule being exercised, not the function
- `it` strings read as plain-English statements of fact: `"decrements Stage.expectedValue when an opportunity is deleted"`
- One assertion per test — if a test fails, the name alone should identify the broken rule
- No shared mutable state between tests; each test sets up exactly what it needs
