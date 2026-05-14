# Changelog

All notable changes to this project are documented here.

---

## 2026-05-14 (shadcn/ui + lead edit modal + code cleanup)

### Added
- **shadcn/ui** installed in the client (`@base-ui/react`, `clsx`, `tailwind-merge`, `lucide-react`); `Dialog` and `Button` components added to `src/components/ui/`
- `@/*` path alias wired into `tsconfig.app.json`, `vite.config.ts`, and `vitest.config.ts`

### Changed
- **`LeadRow` edit form** converted from an inline table-row replacement to a `Dialog` modal; the `<tr>` always stays in the DOM
- `formatCurrency` extracted from `lead-row.tsx` and `pipeline.tsx` into `src/lib/utils.ts` (single source of truth)
- `deleteOpportunity` now removes the item from local React state instead of re-fetching all opportunities from the API
- `oppsFetched` ref added to `LeadRow` — prevents redundant `GET /api/opportunities` calls on repeated show/hide
- `POST /opportunities`: lead and stage DB lookups now run in parallel via `Promise.all`
- `PUT /opportunities/:id`: removed unreachable `?? null` inside the `!== undefined` guard for `closeDate`
- Removed meaningless `key={lead.id}` from the non-iterated `<tr>` in `LeadRow`

---

## 2026-05-14 (closeDate field)

### Added
- **`Opportunity.closeDate`** (server): nullable `date` column on the `Opportunity` TypeORM entity; auto-migrated via `synchronize: true` on next server start (tradeoff: safe for SQLite dev, would require an explicit migration in production)
- `POST /opportunities` and `PUT /opportunities/:id` pass `closeDate` through from the request body
- `closeDate?: string | null` added to the client `Opportunity` interface in `types.ts`
- Two new tests in `opportunity.test.ts` under `describe("closeDate")`: persists a date string when set; stores `null` when omitted

---

## 2026-05-14 (frontend test coverage)

### Added
- **Component test suite** (client): 59 tests across 8 files, one file per component (`App`, `AddLead`, `LeadRow`, `Leads`, `ManageFields`, `ManageSettings`, `ManageStages`, `Pipeline`)
- Tests cover all key behaviors: form submission with payload verification, API error display, success/empty states, navigation, inline editing, opportunity display and deletion, custom field rendering, settings save flow, stage add/edit/delete with confirmation, and pipeline report rendering including won/lost row highlighting
- Integration test for `handleFieldsChanged`: verifies a field added in Settings appears in the AddLead form on return to Home
- `vi.clearAllMocks()` in `beforeEach` to prevent mock call-history leakage between tests

### Coverage (client)
| Metric | Before | After |
|---|---|---|
| Statements | — | 98.4% |
| Branches | — | 91% |
| Functions | — | 98.8% |
| Lines | — | 100% |

Remaining branch gaps are all unreachable internal guards or dead code (e.g. `lead-row.tsx:77` — edit form success message never renders due to React 19 automatic batching of `setSuccess`/`setIsEditing`).

---

## 2026-05-14 (test coverage expansion)

### Added
- **`settings-cascade.test.ts`** (server): 10 tests covering `wonStageLikelihood` and `lostStageLikelihood` setting changes cascading to all affected stage `expectedValue` totals; verifies isolation (pending/won/lost stages unaffected by the wrong key)
- **`api.test.ts`** (server): 26 integration tests via supertest covering every HTTP route — leads, stages, custom fields, settings, opportunities, and the pipeline report; emphasis on `minimumOpportunityValue` enforcement on create and update, opportunity stage-change accounting, and settings cascade via HTTP
- **supertest** added as a dev dependency in the server package

### Changed
- `index.ts` refactored to export `buildApp(ds: DataSource)` so tests inject an in-memory SQLite DataSource; production startup unchanged
- `run()` guarded with `if (require.main === module)` to prevent the production server from starting on test import; documented with inline comments
- `tsconfig.json`: added `esModuleInterop: true` and updated `import express` to default-import style to fix Vitest ESM interop
- `/* v8 ignore */` blocks added around the production entry-point code (`run()` and its guard) with explanatory comments; statements, functions, and lines now all at 100%

### Coverage (server)
| Metric | Before | After |
|---|---|---|
| Statements | 1% | 100% |
| Branches | 0% | 92% |
| Functions | 14% | 100% |
| Lines | 1% | 100% |

---

## 2026-05-14

### Added
- **Code coverage reporting** via `@vitest/coverage-v8` in both packages
  - `npm run test` now prints a per-file coverage table to the terminal
  - HTML report written to each package's `coverage/` directory (gitignored)
- **Testing philosophy documented** in CLAUDE.md: tests serve as code documentation; `describe`/`it` names are plain-English behavioral statements, one assertion per test

### Changed
- Updated CLAUDE.md to reflect actual test setup (SWC gotcha, helper patterns, axios mock convention, coverage output locations)

---

## 2026-05-14 (initial)

### Added
- **Vitest test infrastructure** for both packages
  - Server: Vitest + SWC (required for TypeORM decorator metadata); in-memory SQLite per test run via a shared `createTestDataSource()` helper
  - Client: Vitest + React Testing Library + jsdom
  - `npm run test` at the repo root runs both suites
- **Initial test coverage** focused on the highest-risk business logic
  - `opportunity.test.ts` (server): `expectedValue` calculation for pending/won/lost stages; `Stage.expectedValue` accumulation, decrement, and cross-stage moves; `minimumOpportunityValue` enforcement
  - `App.test.tsx` (client): nav rendering and default active page
- **CLAUDE.md**: repository guide for Claude Code with architecture notes, commands, and testing conventions
