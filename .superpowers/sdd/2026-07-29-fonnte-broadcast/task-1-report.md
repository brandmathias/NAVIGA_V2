# Task 1 report: server-only Fonnte client

## TDD evidence

- RED: `node --test tests/fonnte-client.test.mjs` exited 1 because
  `src/lib/fonnte-client.js` did not exist (`ERR_MODULE_NOT_FOUND`).
- GREEN: `node --test tests/fonnte-client.test.mjs` exited 0: 2 passed, 0 failed.
- Full suite: `npm test` exited 0: 36 passed, 0 failed.

## Changed files

- `src/lib/fonnte-client.js`: CommonJS server adapter using native `fetch` and
  `FormData`; it sends valid recipient rows only, with a 60-second delay.
- `src/lib/fonnte-client.d.ts`: typed public adapter surface.
- `tests/fonnte-client.test.mjs`: proves endpoint, Authorization token, serialised
  delay, invalid-row filtering, disabled short-circuiting, and no real request.
- `README.md`: documents the ignored local `FONNTE_ENABLED` and `FONNTE_TOKEN`
  environment variables without a real token.
- `task-1-report.md`: records the TDD evidence, review, and remaining concern.

## Self-review

- `FONNTE_ENABLED` must be exactly `true`, and a missing token also keeps the
  adapter disabled before any fetch.
- The adapter returns only accepted queue count and optional response `id`; it
  does not claim delivery.
- No client component imports the adapter, no package was added, and tests inject
  `fetchImpl`, so no real outbound request occurs.
- `git diff --check` completed with no whitespace errors.

## Concerns

- Fonnte response reference handling is intentionally limited to its `id` field;
  a future confirmed API contract can map another reference field if needed.
- `graphify update .` refreshed generated `graphify-out/` files. They are left
  unstaged because they are generated workspace state, not Task 1 source.

## Follow-up: server-only boundary and missing-token regression

- Inspected Next 15's bundled `server-only` marker at
  `next/dist/compiled/server-only`: Next's webpack rule rejects it from client
  layers, while direct Node loading throws. The adapter therefore conditionally
  requires the standard `server-only` specifier only when `NEXT_RUNTIME` is
  present; Next still analyzes the literal import, while plain Node tests do not
  execute it.
- Added a missing-token test that confirms rejection and zero fetch calls.
- RED: `node --test tests/fonnte-client.test.mjs` exited 1 with 3 passing tests
  and the expected missing `require('server-only')` marker assertion. The new
  missing-token regression passed immediately because the existing Task 1 guard
  already enforced that behavior.
- GREEN: `node --test tests/fonnte-client.test.mjs` exited 0: 4 passed, 0 failed.
- Full suite: `npm test` exited 0: 38 passed, 0 failed.
