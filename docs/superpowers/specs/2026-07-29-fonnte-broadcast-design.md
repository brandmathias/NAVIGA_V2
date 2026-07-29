# Fonnte Broadcast Design

## Goal

NAVIGA will queue WhatsApp text notifications through Fonnte for PDF gadai
and XLSX angsuran records that contain a valid Indonesian mobile number. The
first message may be sent immediately by Fonnte; every following recipient is
spaced exactly 60 seconds apart. NAVIGA reports only that Fonnte accepted the
queue, never that a message was delivered.

## Scope and roles

- Superadmin may queue recipients belonging to any active registered unit.
- Admin Unit may queue only records whose SBG or account identifier starts
  with that account's assigned five-digit prefix.
- XLSX rows without a valid `No HP` column remain copy-message and Piper TTS
  only. Rows with a valid phone number get the same single and selected
  Fonnte actions as PDF rows.
- Voice-note handling remains manual: Piper creates the audio and NAVIGA does
  not claim that it was sent.

## Server-only Fonnte adapter

`src/lib/fonnte-client.js` will be the only place that calls
`https://api.fonnte.com/send`. It reads `FONNTE_TOKEN` on the server and sends
it in the `Authorization` header, so no browser code, bundle, or history entry
contains the token.

The adapter accepts a prepared list of recipient-specific `target`, `message`,
and `delay` objects. It serializes them as Fonnte's `data` request field with
`delay: "60"` for every recipient. It rejects missing or malformed recipients,
an unavailable token, disabled sending, HTTP failure, and Fonnte error
responses with an actionable error.

Live outbound requests are guarded by `FONNTE_ENABLED=true`; the default is
disabled. Tests inject a fake fetch implementation, so no test or fixture can
contact Fonnte or WhatsApp.

## Queue action and validation

A server action receives imported customer records and the selected template.
It requires the signed local session, loads active unit prefixes, checks every
identifier again, normalizes every phone number, and generates the message on
the server. Browser-supplied text, phone values, or unit scope are not trusted.

The action submits one Fonnte batch only after the operator confirms the UI
dialog. A successful response returns the accepted recipient count and Fonnte
reference when available. The client records `Antrean Fonnte Diterima` in its
existing local activity history, then clears only the queued selection. A
failure preserves the selection and shows the server error.

## UI behavior

PDF replaces the per-row WhatsApp-tab send menu and selected-tab loop with
Fonnte queue actions. XLSX adds selection controls and the same queue action
only for records with valid phone numbers; invalid/no-number rows remain
visible but cannot be queued. Copy and Piper controls remain available.

The confirmation describes the exact selected count, 60-second interval, and
the fact that acceptance is not delivery. When Fonnte is disabled, the UI
shows how to enable it rather than attempting a request.

## Local test fixtures

Two ignored files under `tmp/fonnte-fixtures/` will use the supplied test
identity: `Brando Mathias Zusriadi`, WhatsApp `0895803416704`, and a Wanea
`11787` identifier. The PDF mirrors the due-date report's tabular fields; the
XLSX mirrors the installment columns and includes `No HP` plus an identifier.
They are parsing and UI fixtures only, never a send test, and are excluded from
Git.

## Verification

- Unit and superadmin queue-action tests prove that the server rejects
  out-of-scope IDs, invalid numbers, and disabled configuration before fetch.
- Adapter tests assert the Fonnte request shape, direct Authorization header,
  and exact 60-second per-recipient delay using mocked fetch.
- Page tests assert there is no browser-side Fonnte token or `wa.me` text-send
  path, and that XLSX preserves copy/Piper behavior without a number.
- Typecheck, full unit tests, production build, local login, and fixture
  imports are run before the feature is reported complete.
