# Changelog

All notable changes to this project are documented here.

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
