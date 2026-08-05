# Graph Report - NAVIGA  (2026-08-06)

## Corpus Check
- 220 files · ~239,660 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1299 nodes · 2412 edges · 156 communities (111 shown, 45 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27cb012d`
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
- profile/page.tsx
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
- unit-registry.d.ts
- Global Constraints
- user-facing-copy.test.mjs
- dashboard/page.tsx
- types/index.ts
- HistoryPage
- dropdown-menu.tsx
- alert.tsx
- task-board-workflow-contract.test.mjs
- task-attachment-preview.test.mjs
- PdfBroadcastPage
- @radix-ui/react-checkbox
- local-auth.js
- pg
- @radix-ui/react-collapsible
- @radix-ui/react-tooltip
- Dashboard Staff Executive Registry Design
- Dashboard Staff Executive Registry Implementation Plan
- use-toast.ts
- tasks/page.tsx
- TaskDetailsDialog.tsx
- dropdown-menu.tsx
- import-feedback-copy.test.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `react` - 25 edges
3. `getUserFacingMessage()` - 24 edges
4. `requireSession()` - 23 edges
5. `PdfBroadcastPage()` - 20 edges
6. `useToast()` - 19 edges
7. `XlsxBroadcastPage()` - 17 edges
8. `Button` - 16 edges
9. `compilerOptions` - 16 edges
10. `useLocalSession()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `AdminOnlyForm()` --references--> `react`  [EXTRACTED]
  src/app/(main)/unit-management/new/unit-create-client.tsx → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json

## Import Cycles
- None detected.

## Communities (156 total, 45 thin omitted)

### Community 0 - "cn"
Cohesion: 0.22
Nodes (8): Administration UI, Error Handling, Goal, Initial Credentials, Local Persistence, Multi-Unit Local Authentication Design, Roles, Scope Enforcement

### Community 1 - "pdf-broadcast/page.tsx"
Cohesion: 0.10
Nodes (32): createVisibleBoardData(), MotionCardProps, PageTransition(), PageTransitionProps, directionVariants, motionElements, RevealDirection, ScrollRevealProps (+24 more)

### Community 2 - "extract-from-pdf-flow.ts"
Cohesion: 0.06
Nodes (40): Admin, AdminOnlyForm(), DisplayedAdmin, DraftAdmin, DraftPerson, Person, RelatedAdmin, Unit (+32 more)

### Community 3 - "sidebar.tsx"
Cohesion: 0.08
Nodes (31): SessionContext, Separator, SheetContent, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup (+23 more)

### Community 4 - "login/page.tsx"
Cohesion: 0.14
Nodes (25): generateCustomerVoicenote(), LOCAL_HOSTS, optionalLocalHttpUrl(), requireLocalHttpUrl(), isWav(), piperError(), piperSynthesizeUrl(), { requireLocalHttpUrl } (+17 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (35): devDependencies, postcss, tailwindcss, @types/node, @types/papaparse, @types/pg, @types/react, @types/react-dom (+27 more)

### Community 6 - "use-toast.ts"
Cohesion: 0.16
Nodes (22): xlsx, getAllowedPrefixes(), parseInstallmentImage(), parseXlsx(), SUPPORTED_IMAGE_TYPES, validateImage(), filterInstallmentCustomersByPrefix(), findColumn() (+14 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 8 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 9 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 10 - "carousel.tsx"
Cohesion: 0.06
Nodes (38): KanbanBoard(), AccordionContent, AccordionItem, AccordionTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+30 more)

### Community 11 - "dependencies"
Cohesion: 0.29
Nodes (6): Global Constraints, Multi-Unit Local Authentication Implementation Plan, Task 1: Persistent account and unit registry, Task 2: Dynamic server-side record scope, Task 3: Superadmin registration screen, Task 4: Bootstrap configuration and verification

### Community 12 - "**App Name**: GadaiAlert"
Cohesion: 0.50
Nodes (3): **App Name**: GadaiAlert, Core Features:, Style Guidelines:

### Community 13 - "date-fns"
Cohesion: 0.16
Nodes (14): LoginFormValues, loginSchema, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem (+6 more)

### Community 14 - "dotenv"
Cohesion: 0.29
Nodes (6): Global Constraints, Lightweight Local PDF Extraction Implementation Plan, Task 1: Local RapidDoc process boundary, Task 2: Two-stage local extractor, Task 3: Local setup and legacy removal, Task 4: Install and verify

### Community 15 - "embla-carousel-react"
Cohesion: 0.10
Nodes (12): createUnitRegistry(), AuthenticatedRegistryUser, LocalRole, RegisteredUnit, RegisteredUnitAdmin, UnitAdminDraft, UnitAdminRegistrationInput, UnitAdminUpdateInput (+4 more)

### Community 16 - "firebase"
Cohesion: 0.16
Nodes (19): DashboardPage(), UpcProfileData, upcProfiles, columnOrder, columns, KanbanBoardProps, priorityVariantMap, Avatar (+11 more)

### Community 18 - "@genkit-ai/firebase"
Cohesion: 0.18
Nodes (11): better-auth, class-variance-authority, date-fns, lucide-react, dependencies, better-auth, class-variance-authority, date-fns (+3 more)

### Community 20 - "@genkit-ai/next"
Cohesion: 0.14
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 21 - "@hello-pangea/dnd"
Cohesion: 0.25
Nodes (7): Batasan, File yang disentuh, Motion dan aksesibilitas, Persistensi foto, Profil NAVIGA — Rancangan Redesign, Struktur visual, Tujuan

### Community 22 - "@hookform/resolvers"
Cohesion: 0.40
Nodes (5): localAuthPath, originalEnv, require, unitRegistryPath, withLocalAuth()

### Community 23 - "lucide-react"
Cohesion: 0.13
Nodes (38): MainLayout(), deleteUnitAdminAction(), readList(), registerUnitAction(), registerUnitAdminAction(), requireSuperadmin(), updateUnitAction(), updateUnitAdminAction() (+30 more)

### Community 28 - "@radix-ui/react-accordion"
Cohesion: 0.50
Nodes (3): Edit Unit and Admin Detail Implementation Plan, Global Constraints, Tasks

### Community 29 - "TaskKanbanBoard.tsx"
Cohesion: 0.23
Nodes (12): formatFileSize(), getPreviewKind(), TaskAttachmentPreview(), TaskAttachmentPreviewProps, attachmentUrl(), deleteTaskAttachment(), getTaskAttachment(), previewTaskAttachment() (+4 more)

### Community 31 - "TaskKanbanBoard.tsx"
Cohesion: 0.16
Nodes (14): metadata, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle (+6 more)

### Community 32 - "@radix-ui/react-collapsible"
Cohesion: 0.36
Nodes (9): react, react, LoginPage(), ProfilePage(), UnitCreateClient(), missingValue(), UnitManagementClient(), MainShell() (+1 more)

### Community 36 - "@radix-ui/react-popover"
Cohesion: 0.18
Nodes (8): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES, useChart()

### Community 39 - "@radix-ui/react-scroll-area"
Cohesion: 0.33
Nodes (5): Global Constraints, NAVIGA Profile Redesign Implementation Plan, Task 1: Add the photo storage boundary, Task 2: Implement the profile layout and interactions, Task 3: Verify the finished change

### Community 42 - "@radix-ui/react-slider"
Cohesion: 0.33
Nodes (5): Global Constraints, Photo Import Extraction Implementation Plan, Task 1: Convert a photographed Angsuran table into import rows, Task 2: Add local photo OCR and server actions, Task 3: Expose photo import controls

### Community 44 - "cn"
Cohesion: 0.25
Nodes (7): Arah visual: editorial identity token, Batasan, Implementasi dan verifikasi, Interaksi, Kriteria selesai, Sidebar Profile — Editorial Identity Token, Tujuan

### Community 46 - "@radix-ui/react-tooltip"
Cohesion: 0.25
Nodes (7): Global Constraints, NAVIGA Local Chandra and Piper Implementation Plan, Task 1: Local session and route guards, Task 2: Chandra PDF extraction boundary, Task 3: XLSX deterministic import, Task 4: Piper voice service boundary, Task 5: Legacy removal and verification

### Community 49 - "types/index.ts"
Cohesion: 0.31
Nodes (11): HistoryPage(), clearBroadcastHistory(), createBroadcastHistoryEntry(), getBroadcastHistory(), metadataOnly(), migrateLegacyBroadcastHistory(), readError(), metadataOnly() (+3 more)

### Community 53 - "AddTaskDialog.tsx"
Cohesion: 0.47
Nodes (5): applyTheme(), getSystemTheme(), Theme, ThemeSwitch(), ViewTransitionDocument

### Community 55 - "README.md"
Cohesion: 0.50
Nodes (3): Cakupan unit, NAVIGA, Uji lokal

### Community 59 - "cn"
Cohesion: 0.12
Nodes (38): ActionStatus, formatCurrency(), formatDate(), getUnitLabel(), getUpcFromId(), NotificationTemplate, parseDateForFormatting(), PdfBroadcastPage() (+30 more)

### Community 60 - "local-auth.d.ts"
Cohesion: 0.40
Nodes (5): LocalAuthError, LocalRole, LocalSession, LocalUpc, LocalUser

### Community 61 - "profile/page.tsx"
Cohesion: 0.09
Nodes (47): DELETE(), errorMessage(), errorStatus(), GET(), noStoreHeaders, POST(), AttachmentRouteContext, contentDisposition() (+39 more)

### Community 63 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Native PDF Gadai Extraction Implementation Plan, Task 1: Parse Pegadaian layout text, Task 2: Add lightweight native PDF extraction, Task 3: Remove Java extraction setup, Task 4: Real-document and full verification

### Community 65 - "xlsx"
Cohesion: 0.29
Nodes (6): Design, Error Handling and Privacy, Evidence, Goal, Native PDF Gadai Extraction Design, Success Criteria

### Community 66 - "tasks/page.tsx"
Cohesion: 0.11
Nodes (21): AddTaskDialog(), AddTaskDialogProps, duplicateSignature(), EditorCommand, editorTools, formatDeadline(), getDaysLeftLabel(), Priority (+13 more)

### Community 68 - "start-chandra.ps1"
Cohesion: 0.21
Nodes (15): Path, main(), add_installment_cell(), create_engine(), gadai_column(), gadai_header_anchors(), gadai_header_column(), group_ocr_lines() (+7 more)

### Community 71 - "radio-group.tsx"
Cohesion: 0.05
Nodes (64): getAllowedPrefixes(), ParsedBroadcastCustomer, parseGadaiImage(), parsePdf(), SUPPORTED_IMAGE_TYPES, validateImage(), aliasToField, cleanHtmlCell() (+56 more)

### Community 76 - "select.tsx"
Cohesion: 0.40
Nodes (4): addTaskDialog, calendar, taskDialogConfig, taskTypes

### Community 78 - "@hello-pangea/dnd"
Cohesion: 0.25
Nodes (7): Goal, Interaction, Responsive behavior, Scope and boundaries, Sidebar Profile Luxe Design, Verification and delivery, Visual direction: Porcelain Identity Plaque

### Community 79 - "sheet.tsx"
Cohesion: 0.29
Nodes (5): clientPath, itemRoutePath, migrationPath, repositoryPath, uploadRoutePath

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
Cohesion: 0.40
Nodes (4): mainShellPath, mainShellStylesPath, storageSourcePath, userPhotoRoutePath

### Community 110 - "dropdown-menu.tsx"
Cohesion: 0.50
Nodes (3): DirectoryAdmin, DirectoryPerson, DirectoryUnit

### Community 111 - "alert.tsx"
Cohesion: 0.44
Nodes (7): getGoogleMapsEmbedUrl(), GOOGLE_MAP_HOSTS, isGoogleMapsEmbedUrl(), isGoogleMapsUrl(), parseUrl(), { getGoogleMapsEmbedUrl }, require

### Community 112 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): authRoute, authSource, loginPage

### Community 113 - "task-api-contract.test.mjs"
Cohesion: 0.40
Nodes (4): pagePath, repositoryPath, routePath, sessionPath

### Community 118 - "clsx"
Cohesion: 0.29
Nodes (6): Global Constraints, Sidebar Profile Luxe Implementation Plan, Task 1: Lock the new profile contracts with focused tests, Task 2: Implement the Porcelain Identity Plaque, Task 3: Refresh the project graph and run verification, Task 4: Commit, push, and open the reviewable PR

### Community 120 - "@radix-ui/react-tooltip"
Cohesion: 0.23
Nodes (14): columnIcons, columnTones, formatDueDate(), formatFileSize(), getCreatorName(), getCreatorPhotoSrc(), getInitials(), getPriorityMeta() (+6 more)

### Community 126 - "unit-registry.d.ts"
Cohesion: 0.20
Nodes (8): clientPath, historyPagePath, legacyPath, migrationPath, pdfPagePath, repositoryPath, routePath, xlsxPagePath

### Community 127 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Sidebar Theme Switch Implementation Plan, Task 1: Theme-switch regression contract, Task 2: Shared sidebar placement and NAVIGA dark surface, Task 3: Shared content and overlay dark-theme treatment

### Community 131 - "dashboard/page.tsx"
Cohesion: 0.33
Nodes (5): Global Constraints, Sidebar Profile Editorial Identity Token Implementation Plan, Task 1: Kunci kontrak struktur editorial pada tes, Task 2: Implementasikan silhouette editorial pada trigger profil, Task 3: Verifikasi integrasi dan sinkronisasi Graphify

### Community 132 - "types/index.ts"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 133 - "HistoryPage"
Cohesion: 0.21
Nodes (11): LoginHistoryItem, Unit, UnitAdmin, Button, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+3 more)

### Community 135 - "alert.tsx"
Cohesion: 0.50
Nodes (3): Dashboard Single Viewport Implementation Plan, Global Constraints, Task 1: Kontrak layout satu viewport

### Community 136 - "task-board-workflow-contract.test.mjs"
Cohesion: 0.08
Nodes (40): errorMessage(), errorStatus(), GET(), getAuthorizedSession(), PUT(), creatorFromSession(), creatorIsLegacy(), isRecord() (+32 more)

### Community 138 - "task-attachment-preview.test.mjs"
Cohesion: 0.50
Nodes (3): addTaskDialog, preview, taskDetailsDialog

### Community 139 - "PdfBroadcastPage"
Cohesion: 0.20
Nodes (12): { authenticateAccount }, { createHmac, timingSafeEqual }, createSessionToken(), getSession(), getSessionSecret(), hasSameValue(), LocalAuthError, parseSession() (+4 more)

### Community 146 - "Dashboard Staff Executive Registry Design"
Cohesion: 0.29
Nodes (6): Arah Visual, Batasan, Dashboard Staff Executive Registry Design, Detail Komponen, Pengujian, Tujuan

### Community 148 - "Dashboard Staff Executive Registry Implementation Plan"
Cohesion: 0.50
Nodes (3): Dashboard Staff Executive Registry Implementation Plan, Global Constraints, Task 1: Executive Registry Staff Cards

### Community 151 - "use-toast.ts"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 152 - "tasks/page.tsx"
Cohesion: 0.27
Nodes (8): priorityFilterOptions, responseError(), SortMode, sortOptions, TaskFilter, TasksPage(), getUserFacingMessage(), feedbackPaths

### Community 153 - "TaskDetailsDialog.tsx"
Cohesion: 0.27
Nodes (8): EditorCommand, editorTools, formatFileSize(), TaskDetailsDialog(), Label, labelVariants, downloadTaskAttachment(), plainTaskDescription()

### Community 154 - "dropdown-menu.tsx"
Cohesion: 0.25
Nodes (7): DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent, DropdownMenuSubTrigger

## Knowledge Gaps
- **484 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+479 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `@genkit-ai/firebase` to `devDependencies`, `dropdown-menu.tsx`, `use-toast.ts`, `@radix-ui/react-checkbox`, `local-auth.js`, `pg`, `@radix-ui/react-collapsible`, `@radix-ui/react-tooltip`, `genkit`, `next`, `@radix-ui/react-avatar`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `react-dom`, `react-hook-form`, `@radix-ui/react-dropdown-menu`, `react-day-picker`, `patch-package`, `tailwind-merge`, `framer-motion`, `@radix-ui/react-slot`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`, `@radix-ui/react-accordion`, `@radix-ui/react-scroll-area`, `tailwindcss-animate`, `clsx`, `papaparse`, `pg`, `@radix-ui/react-toast`, `recharts`, `embla-carousel-react`, `@radix-ui/react-progress`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `react` connect `@radix-ui/react-collapsible` to `extract-from-pdf-flow.ts`, `sidebar.tsx`, `@radix-ui/react-popover`, `date-fns`, `firebase`, `types/index.ts`, `@genkit-ai/firebase`, `@genkit-ai/next`, `AddTaskDialog.tsx`, `tasks/page.tsx`, `cn`, `@radix-ui/react-tooltip`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `cn()` connect `carousel.tsx` to `pdf-broadcast/page.tsx`, `extract-from-pdf-flow.ts`, `sidebar.tsx`, `types/index.ts`, `HistoryPage`, `menubar.tsx`, `date-fns`, `firebase`, `@genkit-ai/next`, `TaskDetailsDialog.tsx`, `dropdown-menu.tsx`, `TaskKanbanBoard.tsx`, `TaskKanbanBoard.tsx`, `@radix-ui/react-collapsible`, `@radix-ui/react-popover`, `types/index.ts`, `cn`, `tasks/page.tsx`, `@radix-ui/react-tooltip`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _484 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pdf-broadcast/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09851551956815115 - nodes in this community are weakly interconnected._
- **Should `extract-from-pdf-flow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05589225589225589 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07563025210084033 - nodes in this community are weakly interconnected._