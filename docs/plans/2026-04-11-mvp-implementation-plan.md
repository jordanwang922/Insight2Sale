# 智慧父母 CRM MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working MVP of the parenting assessment sales CRM, including the mobile assessment flow, scoring/report engine, salesperson workspace, manager overview, configurable statuses, and editable SOP/template features.

**Architecture:** Use a single Next.js application with App Router to host the parent H5 flow, sales workspace, and manager dashboard. Use Prisma with PostgreSQL-oriented schema design, but allow local development on SQLite first if needed for speed; keep schema portable. Implement the assessment and reporting engine as pure TypeScript domain modules so UI and server actions share the same source of truth.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Zod, Recharts, Auth.js, Vitest, Testing Library

---

## File Structure

- `package.json`: app dependencies and scripts
- `prisma/schema.prisma`: database schema
- `prisma/seed.ts`: seed users, statuses, templates, and assessment data
- `src/app/`: Next.js routes and layouts
- `src/app/(marketing)/assessment/*`: parent H5 assessment flow
- `src/app/(dashboard)/*`: sales and manager dashboard routes
- `src/components/*`: reusable UI components
- `src/features/assessment/*`: question bank, scoring engine, report generation
- `src/features/crm/*`: CRM domain types, status helpers, dashboard summaries
- `src/features/templates/*`: persona copy and script template helpers
- `src/lib/*`: prisma, auth, utilities
- `src/server/actions/*`: server actions for assessment submission and CRM updates
- `tests/*`: Vitest coverage for scoring and report logic

---

### Task 1: Scaffold the application

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] Create the Next.js app scaffold with TypeScript, Tailwind, ESLint, and App Router
- [ ] Add baseline scripts for dev, build, lint, test, prisma, and seed
- [ ] Verify the app boots locally

### Task 2: Set up the database and auth foundation

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/prisma.ts`
- Create: `src/lib/auth.ts`
- Create: `src/auth.ts`

- [ ] Model users, roles, customers, assessments, reports, statuses, appointments, notes, persona copy, and templates
- [ ] Add a portable schema that can run in development immediately
- [ ] Seed one manager, one salesperson, default statuses, and baseline template records

### Task 3: Build the assessment data model and parser

**Files:**
- Create: `src/features/assessment/types.ts`
- Create: `src/features/assessment/questions.ts`
- Create: `src/features/assessment/intake-fields.ts`
- Create: `tests/assessment/questions.test.ts`

- [ ] Structure the 45-question bank into typed data
- [ ] Include the intake fields shown in the user-provided screenshots
- [ ] Preserve question text, options, scores, theory references, scoring logic, and explanations
- [ ] Add tests to ensure the expected question count and dimension coverage

### Task 4: Implement the scoring and report engine

**Files:**
- Create: `src/features/assessment/scoring.ts`
- Create: `src/features/assessment/report.ts`
- Create: `src/features/assessment/course-mapping.ts`
- Create: `tests/assessment/scoring.test.ts`
- Create: `tests/assessment/report.test.ts`

- [ ] Implement the six-dimension scoring model
- [ ] Implement anxiety, burnout, and competence indexes
- [ ] Implement the nine parent-type mapping and dimension match narratives
- [ ] Implement course-module recommendations and sales-facing report output

### Task 5: Build the parent H5 flow

**Files:**
- Create: `src/app/(marketing)/assessment/page.tsx`
- Create: `src/app/(marketing)/assessment/start/page.tsx`
- Create: `src/app/(marketing)/assessment/result/[submissionId]/page.tsx`
- Create: `src/components/assessment/*`

- [ ] Build the mobile-first intake form
- [ ] Build the question-by-question assessment UI
- [ ] Submit answers through server actions
- [ ] Show the basic parent-facing result view

### Task 6: Build the sales dashboard shell

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/app/(dashboard)/customers/page.tsx`
- Create: `src/app/(dashboard)/customers/[customerId]/page.tsx`
- Create: `src/components/dashboard/*`

- [ ] Create the responsive dashboard shell
- [ ] Build the salesperson home view with today’s work and customer funnels
- [ ] Build the customer list with filters and search
- [ ] Build the core customer workspace page

### Task 7: Build the manager overview

**Files:**
- Create: `src/app/(dashboard)/manager/page.tsx`
- Create: `src/features/crm/metrics.ts`
- Create: `src/components/charts/*`

- [ ] Build team summary cards
- [ ] Build funnel and attendance/payment summaries
- [ ] Build salesperson comparison sections
- [ ] Add radar chart rendering for parent and child scores

### Task 8: Build editable SOP, persona, and template workflows

**Files:**
- Create: `src/components/customer-workspace/sop-panel.tsx`
- Create: `src/components/customer-workspace/persona-panel.tsx`
- Create: `src/components/customer-workspace/template-submit-form.tsx`
- Create: `src/server/actions/templates.ts`

- [ ] Show generated SOP sections tied to report output
- [ ] Allow salespeople to edit scripts before calls
- [ ] Allow salespeople to maintain their persona copy library
- [ ] Allow a salesperson to submit effective script snippets into the shared template pool

### Task 9: Build configurable statuses and appointments

**Files:**
- Create: `src/app/(dashboard)/settings/statuses/page.tsx`
- Create: `src/app/(dashboard)/calendar/page.tsx`
- Create: `src/server/actions/statuses.ts`
- Create: `src/server/actions/appointments.ts`

- [ ] Build status dictionary management
- [ ] Build appointment creation and listing
- [ ] Preserve state transition history
- [ ] Ensure the customer workspace always shows the next scheduled action

### Task 10: Verification and documentation updates

**Files:**
- Modify: `docs/logs/development-log.md`
- Modify: `docs/logs/handoff-log.md`

- [ ] Run lint
- [ ] Run tests
- [ ] Run a local production build
- [ ] Update development log and handoff log with actual implementation status
