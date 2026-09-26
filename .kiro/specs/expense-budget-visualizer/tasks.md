# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a fully client-side, mobile-friendly single-page web application using exactly three files: `index.html`, `css/style.css`, and `js/script.js`. The app records expenses, displays a scrollable transaction list, shows a running total balance, and renders a Chart.js pie chart of spending by category. All data is persisted in browser `localStorage`.

## Tasks

- [x] 1. Set up project file structure and HTML skeleton
  - Create `index.html` with semantic markup, viewport meta tag, Chart.js CDN `<script>` tag, and link to `css/style.css` and `js/script.js`
  - Include `<header>` with balance display (`id="balance-display"`), `<main>` with form section, chart section, and list section as described in the design
  - Add inline error `<span>` elements (`aria-live="polite"`) adjacent to each form field
  - Add chart placeholder `<p id="chart-placeholder" hidden>` and `<canvas id="spending-chart">`
  - Add error banner HTML template (injected dynamically via JS — document the expected structure in a comment)
  - Create `css/style.css` as an empty file and `js/script.js` as an empty file
  - _Requirements: 6.2, 6.3, 7.3, 8.1, 8.2, 8.3, 8.4_

- [ ] 2. Implement state, constants, and utility functions in `js/script.js`
  - [x] 2.1 Define module-level state and constants
    - Declare `let transactions = []` and `let spendingChart = null`
    - Define `CATEGORY_COLORS` constant: `{ Food: "#FF6384", Transport: "#36A2EB", Fun: "#FFCE56" }`
    - Define the `localStorage` key constant `STORAGE_KEY = "expense_transactions"`
    - _Requirements: 4.7, 8.5_

  - [x] 2.2 Implement `generateId` utility
    - Use `crypto.randomUUID()` with a fallback of `Date.now().toString(36) + Math.random().toString(36).slice(2)` when `crypto.randomUUID` is unavailable
    - _Requirements: 8.5_

  - [x] 2.3 Implement `formatAmount` utility
    - Return a string formatted as `"$1,234.56"` (currency symbol + 2 decimal places) for any finite positive number
    - _Requirements: 2.2, 3.1_

  - [ ]* 2.4 Write property test for `formatAmount`
    - **Property 8: formatAmount always produces a 2-decimal currency string**
    - **Validates: Requirements 2.2, 3.1**
    - Use `fc.float({ min: 0.01, max: 999999999.99, noNaN: true })` arbitrary
    - Tag: `// Feature: expense-budget-visualizer, Property 8: formatAmount always ends with 2 decimal digits`

- [x] 3. Implement browser support check and boot sequence
  - [x] 3.1 Implement `checkBrowserSupport`
    - Detect `localStorage` and DOM API availability; return `{ supported: boolean, missing: string[] }`
    - If unsupported, inject the full-page error banner listing missing features and halt initialization
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 3.2 Implement `init` entry point
    - Call `checkBrowserSupport`; if unsupported, display error and return early
    - Call `loadTransactions` to populate the `transactions` array
    - Call `attachEventListeners`
    - Call `renderTransactionList`, `renderBalance`, and `renderChart` with the loaded data
    - Bind `init` to the `DOMContentLoaded` event
    - _Requirements: 2.6, 3.4, 4.4, 5.3, 7.4_

- [x] 4. Implement localStorage persistence layer
  - [x] 4.1 Implement `handleStorageError`
    - Inject and display the dismissible error banner (`role="alert"`, `aria-live="assertive"`) with the appropriate read/write message
    - Wire the close button to dismiss the banner
    - _Requirements: 2.5, 5.5_

  - [x] 4.2 Implement `loadTransactions`
    - Read from `localStorage` using `STORAGE_KEY`; parse JSON; return empty array if key is absent
    - On `JSON.parse` failure or any thrown error, call `handleStorageError('read', err)` and return empty array
    - _Requirements: 2.5, 5.3, 5.4_

  - [ ]* 4.3 Write property test for `loadTransactions` / `saveTransactions` round-trip
    - **Property 7: LocalStorage round-trip preserves transactions**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Use `fc.array(transactionArbitrary)` arbitrary; mock `localStorage` for isolation
    - Tag: `// Feature: expense-budget-visualizer, Property 7: localStorage round-trip preserves data`

  - [x] 4.4 Implement `saveTransactions`
    - Serialize `transactions` array to JSON and write to `localStorage` under `STORAGE_KEY`
    - On failure (e.g., quota exceeded), call `handleStorageError('write', err)`; do not rethrow so in-memory state remains usable
    - _Requirements: 5.1, 5.2, 5.5, 5.6_

- [x] 5. Checkpoint — Ensure boot and persistence work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement validation layer
  - [x] 6.1 Implement `validateItemName`, `validateAmount`, and `validateCategory`
    - `validateItemName`: reject empty/whitespace-only strings and strings > 100 chars; return error message or `null`
    - `validateAmount`: reject values outside [0.01, 999,999,999.99], non-finite numbers, and NaN; return error message or `null`
    - `validateCategory`: reject empty string or values not in `["Food","Transport","Fun"]`; return error message or `null`
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [ ]* 6.2 Write property test for `validateItemName` (whitespace rejection)
    - **Property 2: Whitespace-only item names are rejected**
    - **Validates: Requirements 1.3, 1.6**
    - Use `fc.stringOf(fc.constantFrom(' ','\t','\n'), { minLength: 1 })` arbitrary
    - Tag: `// Feature: expense-budget-visualizer, Property 2: Whitespace-only names are always rejected`

  - [ ]* 6.3 Write property test for `validateAmount` (boundary validation)
    - **Property 3: Amount boundary validation**
    - **Validates: Requirements 1.4, 1.6**
    - Use `fc.oneof(fc.float({ max: 0 }), fc.float({ min: 1000000000 }), fc.constant(NaN), fc.constant(Infinity))` arbitrary
    - Tag: `// Feature: expense-budget-visualizer, Property 3: Out-of-range amounts are always rejected`

  - [x] 6.4 Implement `validateForm`, `displayValidationErrors`, and `clearValidationErrors`
    - `validateForm`: call all three field validators; aggregate into `ValidationResult`
    - `displayValidationErrors`: write messages into `<span id="{field}-error">` elements; move focus to first error field
    - `clearValidationErrors`: empty all inline error spans
    - _Requirements: 1.6_

- [x] 7. Implement transaction management
  - [x] 7.1 Implement `addTransaction`
    - Create a `Transaction` object (`id`, `itemName`, `amount`, `category`, `createdAt`)
    - Push to `transactions` array, call `saveTransactions`, then call `renderTransactionList`, `renderBalance`, and `renderChart`
    - _Requirements: 1.7, 2.1, 2.2, 3.2, 4.2, 5.1_

  - [ ]* 7.2 Write property test for `addTransaction` (list growth)
    - **Property 1: Valid transaction grows the list by exactly one**
    - **Validates: Requirements 1.7, 2.1**
    - Use `fc.record({ itemName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), amount: fc.float({ min: 0.01, max: 999999999.99 }), category: fc.constantFrom('Food','Transport','Fun') })`
    - Tag: `// Feature: expense-budget-visualizer, Property 1: Adding a valid transaction increases list length by 1`

  - [x] 7.3 Implement `deleteTransaction`
    - Find the transaction by `id`, splice it from `transactions`, call `saveTransactions`, then call `renderTransactionList`, `renderBalance`, and `renderChart`
    - _Requirements: 2.4, 3.3, 4.3, 5.2_

  - [ ]* 7.4 Write property test for `deleteTransaction` (targeted removal)
    - **Property 4: Delete removes exactly the targeted transaction**
    - **Validates: Requirements 2.4**
    - Use `fc.array(transactionArbitrary, { minLength: 1 })` + `fc.nat` to pick index
    - Tag: `// Feature: expense-budget-visualizer, Property 4: Delete removes only the targeted transaction`

- [x] 8. Implement rendering functions
  - [x] 8.1 Implement `calculateTotal` and `renderBalance`
    - `calculateTotal`: pure function; sum all `amount` fields; return 0 for empty array
    - `renderBalance`: call `calculateTotal`, format with `formatAmount`, update `#balance-display`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 8.2 Write property test for `calculateTotal`
    - **Property 5: Total balance equals sum of all amounts**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Use `fc.array(transactionArbitrary)` arbitrary; verify result matches `amounts.reduce((s, t) => s + t.amount, 0)`
    - Tag: `// Feature: expense-budget-visualizer, Property 5: calculateTotal equals sum of amounts`

  - [x] 8.3 Implement `renderTransactionItem` and `renderTransactionList`
    - `renderTransactionItem`: create `<li>` with item name, `formatAmount(amount)`, category label, and a delete `<button>` with `data-id` attribute
    - `renderTransactionList`: sort transactions newest-first by `createdAt`, clear `<ul id="transaction-list">`, append up to 1000 items using `renderTransactionItem`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 8.4 Implement `aggregateByCategory`, `updateChart`, `showChartPlaceholder`, `hideChartPlaceholder`, and `renderChart`
    - `aggregateByCategory`: pure function; sum amounts per category; return `Record<string, number>`
    - `renderChart`: call `aggregateByCategory`; if no transactions call `showChartPlaceholder`; otherwise call `hideChartPlaceholder` and `updateChart`
    - `updateChart`: create Chart.js `"pie"` instance on first call (with `responsive: true`, `maintainAspectRatio: true`, `CATEGORY_COLORS`); on subsequent calls update `.data` in-place and call `.update()`; destroy instance when transactions become empty
    - `showChartPlaceholder` / `hideChartPlaceholder`: toggle `hidden` attribute on `<canvas>` and `<p id="chart-placeholder">`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 8.5 Write property test for `aggregateByCategory`
    - **Property 6: Category aggregation covers all transactions**
    - **Validates: Requirements 4.1**
    - Use `fc.array(transactionArbitrary, { minLength: 1 })` arbitrary; verify sum of all category values equals `calculateTotal` result
    - Tag: `// Feature: expense-budget-visualizer, Property 6: aggregateByCategory totals match calculateTotal`

- [ ] 9. Implement event wiring
  - [x] 9.1 Implement `handleFormSubmit`
    - Read form values, call `clearValidationErrors`, call `validateForm`
    - On invalid: call `displayValidationErrors` and return without adding
    - On valid: call `addTransaction` and reset form fields to default within 1 second
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 9.2 Implement `handleDeleteClick` and `attachEventListeners`
    - `handleDeleteClick`: read `data-id` from the clicked element, call `deleteTransaction`
    - `attachEventListeners`: bind `handleFormSubmit` to form `submit` event; use event delegation on `#transaction-list` to catch delete button clicks via `handleDeleteClick`
    - _Requirements: 2.4_

- [x] 10. Checkpoint — Ensure core functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement responsive CSS in `css/style.css`
  - [x] 11.1 Write mobile-first base styles (320px+)
    - Single-column flex layout for `<main>`, consistent spacing and typography
    - Style `<header>`, `#balance-display`, `#form-section`, `#chart-section`, `#list-section`
    - Style `.error-msg` for inline validation errors and `.error-banner` for the storage error banner
    - _Requirements: 6.1, 6.2_

  - [x] 11.2 Write responsive breakpoints and touch target styles
    - Add `@media (min-width: 600px)` two-column grid with `grid-template-areas: "form chart" / "list list"`
    - Add `@media (min-width: 1024px)` with `grid-template-columns: 360px 1fr` and `max-width: 1200px; margin: 0 auto`
    - Set `min-height: 44px; min-width: 44px` on all interactive controls (inputs, selects, buttons)
    - Ensure `#chart-section` uses `width: 100%` so Chart.js responsive sizing works correctly
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 12. Final checkpoint — Full verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The design specifies Vanilla JavaScript only — no frameworks or build tools
- Property-based tests use [fast-check](https://github.com/dubzzz/fast-check); run via a simple Node.js test runner (e.g., `node --test`) without a build step
- Each property test references a design property number in a comment directly above the `fc.assert` call for traceability
- Unit tests cover specific examples, error branches, and integration points (see design Testing Strategy section)
- Chart.js must be loaded from CDN before `script.js` in `index.html`
- `saveTransactions` must write to `localStorage` **before** any UI update (Requirements 5.1, 5.2)
- Transaction list must cap at 1000 items (Requirement 2.3)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 1, "tasks": ["2.4", "3.1", "3.2", "4.1"] },
    { "id": 2, "tasks": ["4.2", "4.4", "6.1"] },
    { "id": 3, "tasks": ["4.3", "6.2", "6.3", "6.4"] },
    { "id": 4, "tasks": ["7.1", "7.3", "8.1", "8.3", "8.4"] },
    { "id": 5, "tasks": ["7.2", "7.4", "8.2", "8.5"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["11.2"] }
  ]
}
```
