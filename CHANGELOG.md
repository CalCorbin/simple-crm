# Changelog

All notable changes to this project are documented here.

---

## 2026-05-14 (add opportunity UX + test coverage)

### Added
- **`opp-add-dialog.tsx`**: modal for creating a new opportunity for a lead; shows "For [First] [Last]" in the header so the user always knows which lead they're adding to; labeled fields for name, value, stage (select populated from `GET /api/stages`, defaults to first stage), close date, and any opportunity-scoped custom fields; resets form state on each open; calls `onAdd(res.data)` with the server response so the panel list updates without refetching
- **`opp-add-dialog.test.tsx`**: 15 tests — lead name display, stage load and default selection, stage selector change, name/value/close-date/custom-field submission, `closeDate: null` when field is empty, `onAdd`/`onOpenChange` callbacks, three error paths (`data.error`, raw string data, fallback "An error occurred"), custom field filter (opportunity only), close button clears error, form reset on reopen
- **Add Opportunity button** in the `LeadOppPanel` header; clicking opens `OppAddDialog`; on save the new opportunity appears in the list immediately via local state append

### Changed
- **`lead-opps-panel.tsx`**: now accepts a full `Lead` object instead of just `leadId` so the add dialog can display the lead's name; "Opportunities" heading row converted to a flex row with the heading on the left and the Add Opportunity button on the right
- **`lead-row.tsx`**: passes `lead` instead of `leadId` to `LeadOppPanel`
- **`lead-opps-panel.test.tsx`**: updated `renderPanel` to pass `lead={lead}`; added tests for add-dialog open and successful create flow
- **`opp-edit-dialog.test.tsx`**: four new tests covering previously missing branches — empty-name pre-fill, `parseFloat` NaN fallback to 0, raw string error response, no-data fallback error message

### Coverage (client)
| Metric | Before | After |
|---|---|---|
| Statements | 95.1% | 98.91% |
| Branches | 80.71% | 90.71% |
| Functions | 91.93% | 99.19% |
| Lines | 96.8% | 100% |

---

## 2026-05-14 (add lead modal)

### Added
- **`add-lead-dialog.tsx`**: new component wrapping `AddLead` in a Dialog modal; conditionally renders the form only when open so state resets on each open; accepts `open`, `onOpenChange`, `onSuccess`, and `refreshTrigger` props
- **Add Lead button** in the `Leads` header row opens the modal; on successful submit the modal closes and the leads list refreshes
- Labels (`<label htmlFor>`) added to all inputs in `AddLead`; placeholders removed

### Changed
- **`add-lead.tsx`**: added `onSuccess` prop — when provided, calls it on success (modal path) instead of showing an inline success message (standalone path); removed card container styling and title (now supplied by the dialog)
- **`leads.tsx`**: replaced standalone `<h2>` heading with a flex header row containing the title and the Add Lead button; manages `addLeadOpen` state; composes `AddLeadDialog`
- **`App.tsx`**: removed standalone `<AddLead>` from the home page; add-lead UX now lives entirely within `<Leads>`
- Tests updated: `getByPlaceholderText` → `getByLabelText` throughout `add-lead.test.tsx` and `App.test.tsx`; App integration test updated to open the modal before asserting on the custom-field input

### Tests added
- `"calls onSuccess instead of showing an inline message when the prop is provided"` — covers the `onSuccess` branch in `AddLead`
- `"closes the Add Lead modal and refreshes leads after a lead is created"` — covers `handleLeadAdded` in `Leads`; uses `within(dialog)` to disambiguate the two "Add Lead" buttons in the DOM

---

## 2026-05-14 (opportunity edit modal)

### Added
- **`opp-edit-dialog.tsx`**: modal for editing an opportunity within a lead; fields for name, value, stage (select populated from `GET /api/stages`), close date, and any opportunity-scoped custom fields; resets form state on open; calls `onUpdate(res.data)` with the server response so the panel updates without refetching
- **`opp-edit-dialog.test.tsx`**: 12 tests — pre-fill, stage selector, value/stage/close-date/custom-field submission, `onUpdate`/`onOpenChange` callbacks, error display, error clear on close, `closeDate: null` when cleared, custom field filter (opportunity only)
- **Edit button** added to each row in `LeadOppPanel`; clicking opens `OppEditDialog` for that opportunity; on save the row updates in place via local state replace

### Changed
- **`lead-opps-panel.tsx`**: replaced nested shadcn `<Table>` with a CSS grid `<div>` — removes the table-in-table anti-pattern and enables independent column definitions (Name, Stage, Value, Expected, Close Date, Actions) with a header row and hairline separator
- **`lead-opps-panel.tsx`**: expected value now uses `opp.expectedValue` from the server (respects won/lost likelihood overrides) with a fallback to the naive `value × conversionLikelihood`
- **`lead-opps-panel.test.tsx`**: updated expected-value assertion to match the new column layout (no longer prefixed "Expected: "); added tests for close date display (formatted and absent) and edit dialog open/update flow
- **`lead-edit-dialog.tsx`** and **`opp-edit-dialog.tsx`**: all inputs now have explicit `<label htmlFor>` associations; placeholder-only inputs removed; tests updated to use `getByLabelText` throughout

---

## 2026-05-14 (lead-row component split)

### Added
- **`lead-edit-dialog.tsx`**: extracted edit form + all related state (`firstName`, `lastName`, `age`, `phoneNumber`, `customFields`, `customFieldValues`, `error`, `loading`) and the custom-fields fetch into a standalone component; accepts `lead`, `open`, `onOpenChange`, `onUpdate`
- **`lead-opps-panel.tsx`**: extracted opportunities table, fetch logic, and delete-by-local-state into a standalone component; accepts `leadId`
- **`lead-edit-dialog.test.tsx`**: 9 tests — pre-fill, field updates, API submission, custom fields, `onUpdate`/`onOpenChange` callbacks, error display, error clear on close
- **`lead-opps-panel.test.tsx`**: 4 tests — empty state, unnamed opp, full display with expected value, no-refetch-on-delete

### Changed
- **`lead-row.tsx`** reduced from 200 lines to 48: now owns only `isEditing`/`showOpps` state and composes `LeadEditDialog` + `LeadOppPanel`; data cells read directly from `lead` props (removes a state-staleness bug in the previous mirrored state approach)
- **`lead-row.test.tsx`** trimmed from 15 tests to 5: lead data display, count badge shown/hidden, and two smoke tests confirming child components mount; dialog and panel behavior tests moved to their own files

---

## 2026-05-14 (lint cleanup)

### Fixed
- `manage-fields.tsx`: unused `error` binding in `catch` clause removed (`catch (error)` → `catch`)
- `manage-stages.tsx`: two `as any` casts on `<select>` onChange handlers replaced with `as Stage["status"]`
- `lead-row.tsx`: `react-hooks/exhaustive-deps` warning resolved by inlining the opportunities fetch into the effect and adding `lead.id` to the dependency array; standalone `fetchOpportunities` function removed
- `eslint.config.js`: `coverage/` and `src/components/ui/` added to the ignore list — `coverage/` to suppress warnings on generated report files, `src/components/ui/` to suppress the `react-refresh/only-export-components` warning on shadcn-generated files that export non-component values (e.g. `buttonVariants`)

---

## 2026-05-14 (leads table UX)

### Added
- **shadcn `Table` component** added to `src/components/ui/table.tsx`
- `leads.tsx` now fetches leads and opportunities in parallel (`Promise.all`) and computes per-lead opp counts at load time
- "Show Opps" button replaced with an `Opportunities` button showing a filled count badge (hidden when zero) and a `ChevronDown`/`ChevronUp` icon — users see how many opps exist before clicking; button switches to `secondary` variant when the panel is open
- Nested opportunities panel uses a shadcn `Table` with columns for name, stage, value, expected value, and a destructive Delete button
- New tests: count badge visible with 2 opps, badge hidden when count is 0, opportunity count badge in `leads.test.tsx`

### Changed
- All bare `<table>/<thead>/<tr>/<th>/<td>` in `leads.tsx` and `lead-row.tsx` replaced with shadcn `Table*` primitives
- Fixed `font-fold` typo → `font-bold` in the Leads heading

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
