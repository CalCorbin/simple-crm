# Changelog

All notable changes to this project are documented here.

---

## 2026-05-14

### Added
- **Vitest test infrastructure** for both packages
  - Server: Vitest + SWC (required for TypeORM decorator metadata); in-memory SQLite per test run via a shared `createTestDataSource()` helper
  - Client: Vitest + React Testing Library + jsdom
  - `npm run test` at the repo root runs both suites
- **Initial test coverage** focused on the highest-risk business logic
  - `opportunity.test.ts` (server): `expectedValue` calculation for pending/won/lost stages; `Stage.expectedValue` accumulation, decrement, and cross-stage moves; `minimumOpportunityValue` enforcement
  - `App.test.tsx` (client): nav rendering and default active page
- **CLAUDE.md**: repository guide for Claude Code with architecture notes, commands, and testing conventions
