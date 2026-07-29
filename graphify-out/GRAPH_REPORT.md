# Graph Report - NAVIGA  (2026-07-29)

## Corpus Check
- 122 files · ~37,845 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 709 nodes · 1198 edges · 95 communities (56 shown, 39 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

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
- dotenv
- embla-carousel-react
- firebase
- genkit
- @genkit-ai/firebase
- @genkit-ai/googleai
- @hello-pangea/dnd
- @hookform/resolvers
- lucide-react
- next
- next.config.ts
- patch-package
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
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
- recharts
- zod
- postcss.config.mjs
- README.md
- cn
- local-auth.d.ts
- alert-dialog.tsx
- @radix-ui/react-dropdown-menu
- Global Constraints
- react-day-picker
- xlsx
- setup-chandra.ps1
- start-chandra.ps1
- sheet.tsx
- radio-group.tsx
- alert.tsx
- accordion.tsx
- @radix-ui/react-tooltip
- tailwind-merge
- @radix-ui/react-switch
- @radix-ui/react-toast
- recharts
- accordion.tsx
- native-pdf-runner.test.mjs
- calendar.tsx
- date-fns
- radio-group.tsx
- @radix-ui/react-popover
- embla-carousel-react

## God Nodes (most connected - your core abstractions)
1. `cn()` - 53 edges
2. `react` - 20 edges
3. `Button` - 16 edges
4. `compilerOptions` - 16 edges
5. `useLocalSession()` - 14 edges
6. `useToast()` - 13 edges
7. `PdfBroadcastPage()` - 11 edges
8. `Card` - 10 edges
9. `CardHeader` - 10 edges
10. `CardContent` - 10 edges

## Surprising Connections (you probably didn't know these)
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `DashboardPage()` --references--> `react`  [EXTRACTED]
  src/app/(main)/dashboard/page.tsx → package.json
- `HistoryPage()` --references--> `react`  [EXTRACTED]
  src/app/(main)/history/page.tsx → package.json
- `PdfBroadcastPage()` --references--> `react`  [EXTRACTED]
  src/app/(main)/pdf-broadcast/page.tsx → package.json
- `ProfilePage()` --references--> `react`  [EXTRACTED]
  src/app/(main)/profile/page.tsx → package.json

## Import Cycles
- None detected.

## Communities (95 total, 39 thin omitted)

### Community 0 - "cn"
Cohesion: 0.22
Nodes (8): Administration UI, Error Handling, Goal, Initial Credentials, Local Persistence, Multi-Unit Local Authentication Design, Roles, Scope Enforcement

### Community 1 - "pdf-broadcast/page.tsx"
Cohesion: 0.09
Nodes (47): DashboardPage(), UpcProfileData, upcProfiles, HistoryPage(), ActionStatus, formatCurrency(), formatDate(), getUnitLabel() (+39 more)

### Community 2 - "extract-from-pdf-flow.ts"
Cohesion: 0.23
Nodes (10): columnOrder, columns, KanbanBoard(), KanbanBoardProps, priorityVariantMap, Badge(), BadgeProps, badgeVariants (+2 more)

### Community 3 - "sidebar.tsx"
Cohesion: 0.06
Nodes (36): SessionContext, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent, DropdownMenuSubTrigger (+28 more)

### Community 4 - "login/page.tsx"
Cohesion: 0.22
Nodes (15): xlsx, getAllowedPrefixes(), parseXlsx(), filterInstallmentCustomersByPrefix(), findColumn(), findIdentifierColumn(), findPhoneColumn(), findVisitColumn() (+7 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (26): devDependencies, postcss, tailwindcss, @types/node, @types/papaparse, @types/react, @types/react-dom, @types/recharts (+18 more)

### Community 6 - "use-toast.ts"
Cohesion: 0.10
Nodes (24): metadata, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle (+16 more)

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
Cohesion: 0.14
Nodes (24): initialData, Unit, AddTaskDialog(), AddTaskDialogProps, mockAssignees, TaskDetailsDialogProps, TaskKanbanBoardProps, Button (+16 more)

### Community 11 - "dependencies"
Cohesion: 0.29
Nodes (6): Global Constraints, Multi-Unit Local Authentication Implementation Plan, Task 1: Persistent account and unit registry, Task 2: Dynamic server-side record scope, Task 3: Superadmin registration screen, Task 4: Bootstrap configuration and verification

### Community 12 - "**App Name**: GadaiAlert"
Cohesion: 0.50
Nodes (3): **App Name**: GadaiAlert, Core Features:, Style Guidelines:

### Community 14 - "dotenv"
Cohesion: 0.29
Nodes (6): Global Constraints, Lightweight Local PDF Extraction Implementation Plan, Task 1: Local RapidDoc process boundary, Task 2: Two-stage local extractor, Task 3: Local setup and legacy removal, Task 4: Install and verify

### Community 15 - "embla-carousel-react"
Cohesion: 0.09
Nodes (15): createUnitRegistry(), AuthenticatedRegistryUser, LocalRole, RegisteredUnit, UnitRegistrationInput, UnitRegistry, defaultRegistry, { dirname, join } (+7 more)

### Community 18 - "@genkit-ai/firebase"
Cohesion: 0.18
Nodes (11): class-variance-authority, date-fns, dependencies, class-variance-authority, date-fns, @radix-ui/react-slot, @radix-ui/react-tabs, tailwindcss-animate (+3 more)

### Community 22 - "@hookform/resolvers"
Cohesion: 0.40
Nodes (5): localAuthPath, originalEnv, require, unitRegistryPath, withLocalAuth()

### Community 36 - "@radix-ui/react-popover"
Cohesion: 0.07
Nodes (34): react, react, LoginFormValues, LoginPage(), loginSchema, UnitManagementClient(), TaskKanbanBoard(), CardFooter (+26 more)

### Community 37 - "@radix-ui/react-progress"
Cohesion: 0.08
Nodes (30): POST(), GET(), generateCustomerVoicenote(), MainLayout(), registerUnitAction(), requireSuperadmin(), UnitManagementPage(), MainShell() (+22 more)

### Community 42 - "@radix-ui/react-slider"
Cohesion: 0.18
Nodes (8): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES, useChart()

### Community 46 - "@radix-ui/react-tooltip"
Cohesion: 0.25
Nodes (7): Global Constraints, NAVIGA Local Chandra and Piper Implementation Plan, Task 1: Local session and route guards, Task 2: Chandra PDF extraction boundary, Task 3: XLSX deterministic import, Task 4: Piper voice service boundary, Task 5: Legacy removal and verification

### Community 55 - "README.md"
Cohesion: 0.50
Nodes (3): Cakupan unit, NAVIGA, Uji lokal

### Community 59 - "cn"
Cohesion: 0.18
Nodes (9): Checkbox, PopoverContent, Progress, RadioGroup, RadioGroupItem, Skeleton(), Slider, Switch (+1 more)

### Community 60 - "local-auth.d.ts"
Cohesion: 0.40
Nodes (5): LocalAuthError, LocalRole, LocalSession, LocalUpc, LocalUser

### Community 61 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 63 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Native PDF Gadai Extraction Implementation Plan, Task 1: Parse Pegadaian layout text, Task 2: Add lightweight native PDF extraction, Task 3: Remove Java extraction setup, Task 4: Real-document and full verification

### Community 65 - "xlsx"
Cohesion: 0.29
Nodes (6): Design, Error Handling and Privacy, Evidence, Goal, Native PDF Gadai Extraction Design, Success Criteria

### Community 68 - "start-chandra.ps1"
Cohesion: 0.67
Nodes (3): RapidDoc, create_engine(), main()

### Community 70 - "sheet.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 71 - "radio-group.tsx"
Cohesion: 0.06
Nodes (48): getAllowedPrefixes(), ParsedBroadcastCustomer, parsePdf(), aliasToField, cleanText(), FIELD_ALIASES, filterGadaiCustomersByPrefix(), findPhone() (+40 more)

### Community 73 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 82 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 85 - "calendar.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 86 - "date-fns"
Cohesion: 0.67
Nodes (3): buttonVariants, Calendar(), CalendarProps

## Knowledge Gaps
- **285 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `@genkit-ai/firebase` to `login/page.tsx`, `devDependencies`, `firebase`, `genkit`, `@hello-pangea/dnd`, `lucide-react`, `next`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-popover`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `cn`, `react-dom`, `react-hook-form`, `recharts`, `zod`, `@radix-ui/react-dropdown-menu`, `react-day-picker`, `setup-chandra.ps1`, `accordion.tsx`, `@radix-ui/react-tooltip`, `tailwind-merge`, `@radix-ui/react-switch`, `@radix-ui/react-toast`, `recharts`, `@radix-ui/react-popover`, `embla-carousel-react`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `react` connect `@radix-ui/react-popover` to `pdf-broadcast/page.tsx`, `sidebar.tsx`, `@radix-ui/react-progress`, `@radix-ui/react-slider`, `@genkit-ai/firebase`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `pdf-broadcast/page.tsx`, `extract-from-pdf-flow.ts`, `sidebar.tsx`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `sheet.tsx`, `use-toast.ts`, `alert.tsx`, `carousel.tsx`, `@radix-ui/react-slider`, `menubar.tsx`, `accordion.tsx`, `calendar.tsx`, `date-fns`, `radio-group.tsx`, `alert-dialog.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pdf-broadcast/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08506493506493507 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06387921022067364 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._