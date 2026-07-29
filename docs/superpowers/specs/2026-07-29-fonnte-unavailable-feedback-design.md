# Fonnte Unavailable Feedback Design

## Goal

When Fonnte is not configured locally, a broadcast request must end safely in the interface with a clear setup message rather than a masked Next.js production error.

## Chosen approach

`queueFonnteMessages` will return `{ accepted: 0, unavailable: true }` before making any network request when `FONNTE_ENABLED` is not `true` or the token is absent. The PDF and XLSX pages will detect this response, show the setup message, and will not write a broadcast-history entry.

## Constraints

- The Fonnte token remains server-only and is never returned to the browser.
- A disabled Fonnte integration must never call the Fonnte API.
- Existing validation, unit scope checks, 60-second pacing, and successful queue behavior remain unchanged.
