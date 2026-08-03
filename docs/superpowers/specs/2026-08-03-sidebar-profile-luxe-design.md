# Sidebar Profile Luxe Design

Status: ready for review

## Goal

Redesign the existing sidebar account trigger so it reads as a distinctive, premium light-mode identity token while remaining compact and preserving the current account dropdown behavior. This change will be delivered as a meaningful second pull request, not as a cosmetic placeholder.

## Scope and boundaries

- Preserve the existing account data: avatar, full name, email, and chevron.
- Preserve the existing dropdown actions and account routes.
- Keep the light NAVIGA palette; use one restrained teal accent with porcelain and soft mint neutrals.
- Keep the name and email on one visible line each without ellipsis or clipped text.
- Do not add role labels, account-status cards, metadata, API calls, or new dependencies.
- Modify only the sidebar profile markup/style contracts and their focused visual tests, then refresh Graphify output.

Expected production files:

- `src/components/main-shell.tsx`
- `src/components/main-shell.module.css`
- `tests/profile-photo-policy.test.mjs`
- `tests/unit-management-visual.test.mjs`

No production files will be deleted.

## Visual direction: Porcelain Identity Plaque

The existing button remains the single identity surface. Its treatment changes from a conventional rounded card into a quiet porcelain plaque:

- a pale porcelain surface with a very light mint inner edge;
- an asymmetric corner profile that gives the token a recognizable silhouette;
- a narrow teal registration rail as the only strong accent;
- an elevated avatar medallion with a double hairline ring, without a dark backing card or outer glow;
- a restrained chevron field that reads as a control edge rather than a second button;
- tighter vertical rhythm so the profile remains compact while the full identity stays legible.

The design uses existing Plus Jakarta Sans and lucide icons. No new visual dependency or animation library is introduced.

## Interaction

- Default: quiet porcelain surface and readable identity hierarchy.
- Hover: border, surface, and chevron field become slightly more defined.
- Focus-visible: immediate teal outline with sufficient contrast.
- Active: short tactile press using transform only.
- Open: surface deepens subtly and the chevron rotates.
- Disabled: existing disabled opacity and cursor behavior remain clear.
- Reduced motion: remove spatial movement while preserving state contrast.

The profile trigger has no asynchronous account operation of its own, so no fabricated loading, error, or success copy will be introduced.

## Responsive behavior

The sidebar remains the layout boundary. The profile trigger uses a non-wrapping identity row, visible text overflow rules, a fixed compact avatar size, and a fixed chevron field. The current account identity must remain fully readable at the supported sidebar widths without introducing horizontal page scroll.

## Verification and delivery

- Update focused visual assertions to lock the no-ellipsis and premium surface contracts.
- Run `npm run typecheck`, `npm test`, and `git diff --check`.
- Run `graphify update .` after code changes.
- Push branch `codex/sidebar-profile-luxe` and open a reviewable pull request against `main`.
- The pull request must be merged into `main` before it can count toward the Pull Shark achievement.
