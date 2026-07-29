# Edit Unit and Admin Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each “Lihat detail” action open an editable unit page or editable admin-account dialog, with updates persisted in the local unit registry.

**Architecture:** Reuse the existing unit creation form in edit mode and add narrowly scoped update mutations to the existing registry. The management table navigates to a protected unit-edit route, while its existing dialog switches between create and edit modes.

**Tech Stack:** Next.js App Router, React, TypeScript, server actions, local JSON registry, Node test runner.

## Global Constraints

- Preserve the existing header, sidebar, and unrelated dirty worktree changes.
- Keep update authorization server-side for Superadmin only.
- Keep the existing 5-digit unit prefix and Indonesian province validation.
- Do not use browser-based testing.

## Tasks

- [x] 1. Add a failing registry test for editing a unit and an existing unit-admin account.
- [x] 2. Implement registry update methods with duplicate-prefix/email checks and password preservation when an edited admin leaves the password blank.
- [x] 3. Expose the mutations through Superadmin-only server actions and update type declarations.
- [x] 4. Extend the existing unit form with an edit mode and add a protected `/unit-management/[unitId]` page.
- [x] 5. Turn the management-table detail actions into edit navigation and an edit-mode dialog with context-specific icon and copy.
- [x] 6. Add focused source-level coverage, run the full non-browser validation suite, update graph metadata, then commit and push only task files.
