# Graph Report - NAVIGA  (2026-08-02)

## Corpus Check
- 184 files · ~226,151 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1091 nodes · 1982 edges · 131 communities (86 shown, 45 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4542fcea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- pdf-broadcast/page.tsx
- extract-from-pdf-flow.ts
- sidebar.tsx
- login/page.tsx
- devDependencies
- use-toast.ts
- compilerOptions
- components.json
- menubar.tsx
- carousel.tsx
- dependencies
- **App Name**: GadaiAlert
- date-fns
- dotenv
- embla-carousel-react
- firebase
- genkit
- @genkit-ai/firebase
- @genkit-ai/googleai
- @genkit-ai/next
- @hello-pangea/dnd
- @hookform/resolvers
- lucide-react
- next
- next.config.ts
- patch-package
- @radix-ui/react-accordion
- TaskKanbanBoard.tsx
- @radix-ui/react-avatar
- TaskKanbanBoard.tsx
- @radix-ui/react-collapsible
- @radix-ui/react-dialog
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- cn
- @radix-ui/react-tooltip
- react-dom
- react-hook-form
- types/index.ts
- AddTaskDialog.tsx
- postcss.config.mjs
- README.md
- cn
- local-auth.d.ts
- TaskDetailsDialog.tsx
- @radix-ui/react-dropdown-menu
- Global Constraints
- react-day-picker
- xlsx
- tasks/page.tsx
- start-chandra.ps1
- radio-group.tsx
- patch-package
- select.tsx
- tailwind-merge
- @hello-pangea/dnd
- sheet.tsx
- @radix-ui/react-toast
- embla-carousel-react
- framer-motion
- native-pdf-runner.test.mjs
- tabs.tsx
- @radix-ui/react-slot
- @radix-ui/react-popover
- @radix-ui/react-tabs
- @radix-ui/react-accordion
- @radix-ui/react-scroll-area
- tailwindcss-animate
- Global Constraints
- Sidebar & Header Unit Design
- clsx
- alert.tsx
- profile-photo-policy.test.mjs
- dropdown-menu.tsx
- alert.tsx
- accordion.tsx
- task-api-contract.test.mjs
- papaparse
- pg
- @radix-ui/react-toast
- recharts
- clsx
- embla-carousel-react
- @radix-ui/react-tooltip
- @radix-ui/react-progress
- naviga-directory-contract.test.mjs
- verify-auth-bootstrap.mjs
- theme-switch.tsx
- Global Constraints
- user-facing-copy.test.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `react` - 25 edges
3. `useToast()` - 19 edges
4. `Button` - 16 edges
5. `compilerOptions` - 16 edges
6. `useLocalSession()` - 14 edges
7. `requireSession()` - 14 edges
8. `PdfBroadcastPage()` - 13 edges
9. `listUnits()` - 13 edges
10. `registerUnit()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `AdminOnlyForm()` --references--> `react`  [EXTRACTED]
  src/app/(main)/unit-management/new/unit-create-client.tsx → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `TasksPage()` --references--> `react`  [EXTRACTED]
  src/app/(main)/tasks/page.tsx → package.json

## Import Cycles
- None detected.

## Communities (131 total, 45 thin omitted)

### Community 0 - "cn"
Cohesion: 0.22
Nodes (8): Administration UI, Error Handling, Goal, Initial Credentials, Local Persistence, Multi-Unit Local Authentication Design, Roles, Scope Enforcement

### Community 1 - "pdf-broadcast/page.tsx"
Cohesion: 0.17
Nodes (20): MotionCardProps, PageTransition(), PageTransitionProps, directionVariants, motionElements, RevealDirection, ScrollRevealProps, cardItemVariants (+12 more)

### Community 2 - "extract-from-pdf-flow.ts"
Cohesion: 0.20
Nodes (12): { authenticateAccount }, { createHmac, timingSafeEqual }, createSessionToken(), getSession(), getSessionSecret(), hasSameValue(), LocalAuthError, parseSession() (+4 more)

### Community 3 - "sidebar.tsx"
Cohesion: 0.05
Nodes (47): createVisibleBoardData(), dueTime(), hasLabel(), LabelFilter, labelFilterOptions, responseError(), SortMode, sortOptions (+39 more)

### Community 4 - "login/page.tsx"
Cohesion: 0.09
Nodes (38): xlsx, getAllowedPrefixes(), parseInstallmentImage(), parseXlsx(), SUPPORTED_IMAGE_TYPES, validateImage(), requireSession(), filterInstallmentCustomersByPrefix() (+30 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (32): devDependencies, postcss, tailwindcss, @types/node, @types/papaparse, @types/pg, @types/react, @types/react-dom (+24 more)

### Community 6 - "use-toast.ts"
Cohesion: 0.14
Nodes (25): generateCustomerVoicenote(), LOCAL_HOSTS, optionalLocalHttpUrl(), requireLocalHttpUrl(), isWav(), piperError(), piperSynthesizeUrl(), { requireLocalHttpUrl } (+17 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 8 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 9 - "menubar.tsx"
Cohesion: 0.12
Nodes (10): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarSubContent (+2 more)

### Community 10 - "carousel.tsx"
Cohesion: 0.12
Nodes (14): AccordionContent, AccordionItem, AccordionTrigger, Checkbox, MenubarShortcut(), Progress, RadioGroup, RadioGroupItem (+6 more)

### Community 11 - "dependencies"
Cohesion: 0.29
Nodes (6): Global Constraints, Multi-Unit Local Authentication Implementation Plan, Task 1: Persistent account and unit registry, Task 2: Dynamic server-side record scope, Task 3: Superadmin registration screen, Task 4: Bootstrap configuration and verification

### Community 12 - "**App Name**: GadaiAlert"
Cohesion: 0.50
Nodes (3): **App Name**: GadaiAlert, Core Features:, Style Guidelines:

### Community 13 - "date-fns"
Cohesion: 0.05
Nodes (57): LoginFormValues, loginSchema, LoginHistoryItem, Unit, UnitAdmin, AddTaskDialog(), AddTaskDialogProps, duplicateSignature() (+49 more)

### Community 14 - "dotenv"
Cohesion: 0.29
Nodes (6): Global Constraints, Lightweight Local PDF Extraction Implementation Plan, Task 1: Local RapidDoc process boundary, Task 2: Two-stage local extractor, Task 3: Local setup and legacy removal, Task 4: Install and verify

### Community 15 - "embla-carousel-react"
Cohesion: 0.10
Nodes (12): createUnitRegistry(), AuthenticatedRegistryUser, LocalRole, RegisteredUnit, RegisteredUnitAdmin, UnitAdminDraft, UnitAdminRegistrationInput, UnitAdminUpdateInput (+4 more)

### Community 16 - "firebase"
Cohesion: 0.14
Nodes (23): errorMessage(), errorStatus(), GET(), getAuthorizedScope(), PUT(), DatabaseConfigurationError, getPostgresPool(), NavigaGlobal (+15 more)

### Community 18 - "@genkit-ai/firebase"
Cohesion: 0.18
Nodes (11): better-auth, class-variance-authority, date-fns, lucide-react, dependencies, better-auth, class-variance-authority, date-fns (+3 more)

### Community 20 - "@genkit-ai/next"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 21 - "@hello-pangea/dnd"
Cohesion: 0.25
Nodes (7): Batasan, File yang disentuh, Motion dan aksesibilitas, Persistensi foto, Profil NAVIGA — Rancangan Redesign, Struktur visual, Tujuan

### Community 22 - "@hookform/resolvers"
Cohesion: 0.40
Nodes (5): localAuthPath, originalEnv, require, unitRegistryPath, withLocalAuth()

### Community 23 - "lucide-react"
Cohesion: 0.13
Nodes (37): MainLayout(), readList(), registerUnitAction(), registerUnitAdminAction(), requireSuperadmin(), updateUnitAction(), updateUnitAdminAction(), NewUnitPage() (+29 more)

### Community 28 - "@radix-ui/react-accordion"
Cohesion: 0.50
Nodes (3): Edit Unit and Admin Detail Implementation Plan, Global Constraints, Tasks

### Community 29 - "TaskKanbanBoard.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 31 - "TaskKanbanBoard.tsx"
Cohesion: 0.09
Nodes (27): metadata, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle (+19 more)

### Community 36 - "@radix-ui/react-popover"
Cohesion: 0.14
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 39 - "@radix-ui/react-scroll-area"
Cohesion: 0.33
Nodes (5): Global Constraints, NAVIGA Profile Redesign Implementation Plan, Task 1: Add the photo storage boundary, Task 2: Implement the profile layout and interactions, Task 3: Verify the finished change

### Community 42 - "@radix-ui/react-slider"
Cohesion: 0.33
Nodes (5): Global Constraints, Photo Import Extraction Implementation Plan, Task 1: Convert a photographed Angsuran table into import rows, Task 2: Add local photo OCR and server actions, Task 3: Expose photo import controls

### Community 44 - "cn"
Cohesion: 0.06
Nodes (38): Admin, AdminOnlyForm(), DraftAdmin, DraftPerson, Person, RelatedAdmin, Unit, UnitCreateForm() (+30 more)

### Community 46 - "@radix-ui/react-tooltip"
Cohesion: 0.25
Nodes (7): Global Constraints, NAVIGA Local Chandra and Piper Implementation Plan, Task 1: Local session and route guards, Task 2: Chandra PDF extraction boundary, Task 3: XLSX deterministic import, Task 4: Piper voice service boundary, Task 5: Legacy removal and verification

### Community 49 - "types/index.ts"
Cohesion: 0.40
Nodes (5): StaggerContainer(), StaggerContainerProps, StaggerItem(), StaggerItemProps, staggerContainerVariants()

### Community 53 - "AddTaskDialog.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 55 - "README.md"
Cohesion: 0.50
Nodes (3): Cakupan unit, NAVIGA, Uji lokal

### Community 59 - "cn"
Cohesion: 0.05
Nodes (79): react, react, LoginPage(), DashboardPage(), UpcProfileData, upcProfiles, HistoryPage(), ActionStatus (+71 more)

### Community 60 - "local-auth.d.ts"
Cohesion: 0.40
Nodes (5): LocalAuthError, LocalRole, LocalSession, LocalUpc, LocalUser

### Community 61 - "TaskDetailsDialog.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 63 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Native PDF Gadai Extraction Implementation Plan, Task 1: Parse Pegadaian layout text, Task 2: Add lightweight native PDF extraction, Task 3: Remove Java extraction setup, Task 4: Real-document and full verification

### Community 65 - "xlsx"
Cohesion: 0.29
Nodes (6): Design, Error Handling and Privacy, Evidence, Goal, Native PDF Gadai Extraction Design, Success Criteria

### Community 68 - "start-chandra.ps1"
Cohesion: 0.21
Nodes (15): Path, main(), add_installment_cell(), create_engine(), gadai_column(), gadai_header_anchors(), gadai_header_column(), group_ocr_lines() (+7 more)

### Community 71 - "radio-group.tsx"
Cohesion: 0.07
Nodes (48): getAllowedPrefixes(), ParsedBroadcastCustomer, parseGadaiImage(), parsePdf(), SUPPORTED_IMAGE_TYPES, validateImage(), aliasToField, cleanHtmlCell() (+40 more)

### Community 79 - "sheet.tsx"
Cohesion: 0.18
Nodes (8): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES, useChart()

### Community 80 - "@radix-ui/react-toast"
Cohesion: 0.10
Nodes (31): { GET, POST }, PUT(), GET(), displayLocation(), PUT(), currentUser(), errorMessage(), GET() (+23 more)

### Community 82 - "embla-carousel-react"
Cohesion: 0.50
Nodes (3): adminUrl, client, databaseUrl

### Community 86 - "tabs.tsx"
Cohesion: 0.25
Nodes (7): Global Constraints, PostgreSQL Task Persistence Implementation Plan, Task 1: Board validation contract, Task 2: PostgreSQL repository and migration, Task 3: Protected tasks API, Task 4: Replace client-only persistence, Task 5: Verification

### Community 101 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Sidebar & Header Unit Implementation Plan, Task 1: Protect the intended shell presentation, Task 2: Scope sidebar reference styling, Task 3: Verify and ship only task files, Task 4: Prevent the post-login refresh

### Community 102 - "Sidebar & Header Unit Design"
Cohesion: 0.29
Nodes (6): Accessibility and constraints, Approved visual direction, Goal, Header content by role, Login navigation correction, Sidebar & Header Unit Design

### Community 105 - "alert.tsx"
Cohesion: 0.33
Nodes (5): authSourcePath, photoStoragePath, preciseLocationRoutePath, profilePagePath, profileStylesPath

### Community 107 - "profile-photo-policy.test.mjs"
Cohesion: 0.50
Nodes (3): mainShellPath, storageSourcePath, userPhotoRoutePath

### Community 110 - "dropdown-menu.tsx"
Cohesion: 0.50
Nodes (3): DirectoryAdmin, DirectoryPerson, DirectoryUnit

### Community 112 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): authRoute, authSource, loginPage

### Community 113 - "task-api-contract.test.mjs"
Cohesion: 0.40
Nodes (4): pagePath, repositoryPath, routePath, sessionPath

### Community 126 - "theme-switch.tsx"
Cohesion: 0.47
Nodes (5): applyTheme(), getSystemTheme(), Theme, ThemeSwitch(), ViewTransitionDocument

### Community 127 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Sidebar Theme Switch Implementation Plan, Task 1: Theme-switch regression contract, Task 2: Shared sidebar placement and NAVIGA dark surface, Task 3: Shared content and overlay dark-theme treatment

## Knowledge Gaps
- **404 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+399 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `@genkit-ai/firebase` to `login/page.tsx`, `devDependencies`, `genkit`, `next`, `@radix-ui/react-avatar`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `react-dom`, `react-hook-form`, `cn`, `@radix-ui/react-dropdown-menu`, `react-day-picker`, `tasks/page.tsx`, `patch-package`, `tailwind-merge`, `@hello-pangea/dnd`, `framer-motion`, `@radix-ui/react-slot`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`, `@radix-ui/react-accordion`, `@radix-ui/react-scroll-area`, `tailwindcss-animate`, `clsx`, `alert.tsx`, `papaparse`, `pg`, `@radix-ui/react-toast`, `recharts`, `clsx`, `embla-carousel-react`, `@radix-ui/react-tooltip`, `@radix-ui/react-progress`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `react` connect `cn` to `sidebar.tsx`, `@radix-ui/react-popover`, `cn`, `date-fns`, `sheet.tsx`, `@genkit-ai/firebase`, `theme-switch.tsx`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `cn()` connect `carousel.tsx` to `pdf-broadcast/page.tsx`, `sidebar.tsx`, `@radix-ui/react-popover`, `menubar.tsx`, `cn`, `date-fns`, `sheet.tsx`, `types/index.ts`, `TaskDetailsDialog.tsx`, `@genkit-ai/next`, `AddTaskDialog.tsx`, `cn`, `TaskKanbanBoard.tsx`, `TaskKanbanBoard.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _404 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.054426705370101594 - nodes in this community are weakly interconnected._
- **Should `login/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09302325581395349 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._