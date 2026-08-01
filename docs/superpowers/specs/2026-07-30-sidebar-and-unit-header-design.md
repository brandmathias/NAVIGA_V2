# Sidebar & Header Unit Design

## Goal

Match the supplied NAVIGA sidebar reference while keeping the existing routes and mobile drawer behavior. Make the top header identify a unit user as an operational unit user, rather than presenting the Superadmin-wide message.

## Approved visual direction

- Keep the existing NAVIGA logo asset; place it in a soft white-to-mint brand panel with a decorative wave pattern.
- Keep the desktop sidebar at 292 px. Use a 100 px brand panel and 56 px navigation cards so every label remains visible without ellipsis, with an outline icon, visible focus ring, compact 200 ms transform/color feedback, and a mint-teal active state.
- Keep the compact account card at the bottom with a white initial avatar. It continues to open the existing profile/logout menu.
- Preserve the existing routes, broadcast submenu, role-gated Manajemen Unit item, and responsive sidebar drawer.

## Header content by role

- Superadmin: `NAVIGA Control Center` with the existing cross-platform monitoring description.
- Unit account: `{unit name} Operations Center`, or `NAVIGA Unit Operations Center` when historical account data has no unit name. Its description states that the user manages tasks, broadcasts, and history for the associated unit. It does not claim unit-management access.

## Accessibility and constraints

- Navigation remains semantic buttons because these controls invoke client-side route changes. Active routes retain their selected state and the broadcast trigger exposes expanded state through the existing menu primitive.
- Preserve keyboard-visible focus, explicit image dimensions, truncation for account data, `prefers-reduced-motion` behavior, and only transform/opacity motion.
- Do not change application routes, session schema, or global shell behavior beyond the scoped sidebar and header presentation.

## Login navigation correction

- A successful login redirects once to `/dashboard`. The API response has already written the session cookie, so no subsequent `router.refresh()` is needed or allowed in the success flow.
