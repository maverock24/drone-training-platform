# Guardrails — DroneAI Academy v2

> Applies to all phases in PROGRESS_v2.md. Read-only for executing agents; append-only for "Lessons Learned".

---

## Coding Standards

### TypeScript
- Strict mode enabled — no `any` types, no `@ts-ignore`
- All database table schemas go in `src/db/schema.ts` (Drizzle definitions)
- All content-related interfaces remain in `src/lib/course-data.ts`
- Use `interface` for data shapes, not `type` aliases
- Optional fields use `?` suffix, never `| undefined`
- Drizzle queries use the typed `db` object from `src/db/index.ts` — never raw SQL via `@libsql/client` directly in route handlers

### React / Next.js
- Components are `"use client"` only when they need hooks or interactivity
- Server Components are default — only add `"use client"` when required
- Use named exports for components, not default exports (except `page.tsx` files)
- Props interfaces are defined inline or co-located in the same file
- Follow existing import order: React → Next → shadcn/ui → lucide → local libs → local components
- API routes use the `route.ts` convention (not `route.tsx`)
- Middleware lives in `src/middleware.ts` (single file, not per-route)

### Tailwind CSS
- Use existing design tokens and patterns from shadcn/ui components
- Dark mode via CSS variables (already configured) — no `dark:` prefix utilities
- Responsive: mobile-first, use `sm:` and `md:` breakpoints matching existing patterns
- Match existing card/border patterns: `border-border/50`, `bg-muted/20`, `text-muted-foreground`
- New components must visually match the existing design system — reference `src/components/navbar.tsx` and `src/app/page.tsx` for established patterns

### JSON Content
- All course JSON files must be valid JSON — escape special characters properly
- No trailing commas
- `learning_script` arrays must have exactly 10 elements per lesson, pages numbered 1–10
- `key_takeaways` arrays must have 2–4 items
- Content paragraphs separated by `\n\n` within content strings
- Exam question JSON: each question must have exactly 4 options, `correct_option_index` is 0-based
- EASA regulatory content must be cross-referenced against official EASA sources (2019/947, 2019/945)

### Drizzle ORM
- All table definitions in `src/db/schema.ts` — one file, not split
- Use `drizzle-kit push` for Turso migrations, not `drizzle-kit migrate`
- Never mutate the DB schema outside of numbered migration files
- Use parameterized queries only — never interpolate user input into SQL strings
- Foreign key relationships must use Drizzle's `references()` helper

### API Routes
- All API routes must validate input at the boundary (check required fields, types)
- Return consistent JSON shape: `{ success: true, data: ... }` or `{ error: string }`
- Use HTTP status codes correctly: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error
- Rate-limit auth endpoints (login, register, forgot-password) — 5 attempts per minute per IP
- Stripe webhook route must verify signature before processing any event
- Never return sensitive data (password hashes, full email addresses on public endpoints)

### i18n (Phase 5+)
- All UI strings must go through `useTranslations()` (client) or `getTranslations()` (server)
- Message keys use dot notation: `nav.dashboard`, `exam.timeRemaining`, `pricing.solo.description`
- Never hardcode English strings in JSX after Phase 5 is started
- Locale files: `src/messages/{locale}.json`

---

## Forbidden Patterns

### Security
- **DO NOT** use `dangerouslySetInnerHTML` anywhere in the codebase
- **DO NOT** use `eval()`, `Function()`, or any dynamic code execution
- **DO NOT** store JWT secrets or Stripe keys in client-side code
- **DO NOT** expose user password hashes in any API response
- **DO NOT** trust client-side role checks for authorization — always verify in middleware/API
- **DO NOT** skip Stripe webhook signature verification
- **DO NOT** interpolate user input into raw SQL — always use Drizzle parameterized queries
- **DO NOT** store sensitive data in localStorage (passwords, tokens, payment info)

### Architecture
- **DO NOT** add new npm dependencies without explicit task instruction
- **DO NOT** modify the structure of existing lesson fields (`detailed_explanation`, `step_by_step_guide`, `quiz`)
- **DO NOT** change the existing 5-tab lesson viewer behavior
- **DO NOT** split type definitions across multiple files — SQL types in `src/db/schema.ts`, content types in `src/lib/course-data.ts`
- **DO NOT** use `localStorage` for progress tracking when the user is authenticated — always sync with server
- **DO NOT** create wrapper components around shadcn/ui primitives unless absolutely necessary
- **DO NOT** add loading spinners for static JSON content — it's available at build time
- **DO NOT** use environment variables without the `NEXT_PUBLIC_` prefix for client-side values

### Content
- **DO NOT** generate placeholder or lorem ipsum content — every page must contain real, accurate educational content
- **DO NOT** fabricate citations — no invented paper names, author names, or URLs
- **DO NOT** include unofficial EASA exam questions — mark all as "practice" with disclaimer
- **DO NOT** claim the platform issues official EASA certificates — certificates are platform-internal proof of completion only
- **DO NOT** modify existing domain JSON files (agriculture.json, etc.) beyond adding `prerequisite_tracks` and `easa_category` fields

### Cost
- **DO NOT** add any service that requires a paid subscription at launch
- **DO NOT** replace Turso with PostgreSQL/Supabase (staying within free tier)
- **DO NOT** replace Netlify with Vercel or other paid hosting
- **DO NOT** add Mux, Clerk, or any SaaS with paid-only tiers for required features
- Phase 6 lab compute is the ONLY exception — deferred until revenue covers costs

---

## Architecture Boundaries

| From | Can Import | Cannot Import |
|---|---|---|
| `src/db/schema.ts` | drizzle-orm | React, Next.js, components |
| `src/db/index.ts` | `@libsql/client`, drizzle-orm, `schema.ts` | React, Next.js, components |
| `src/middleware.ts` | jose, `src/db/index.ts`, `src/lib/access-control.ts` | React components |
| `src/lib/auth-context.tsx` | React | `src/db/*` (client-side only) |
| `src/lib/progress-context.tsx` | React, `src/lib/course-data.ts` | `src/db/*` (client-side only) |
| `src/lib/course-data.ts` | JSON course files | React, DB, components |
| `src/lib/domain-data.ts` | JSON domain files | React, DB, components |
| `src/lib/access-control.ts` | `src/db/index.ts` | React, components |
| `src/lib/stripe.ts` | stripe, `src/db/index.ts` | React, components |
| `src/lib/gamification.ts` | `src/db/index.ts` | React, components |
| `src/lib/certificate-generator.ts` | `@react-pdf/renderer`, `src/db/index.ts` | Next.js router |
| `src/app/api/**/*.ts` | `src/db/*`, `src/lib/*` | React components, `"use client"` |
| `src/components/*.tsx` | React, shadcn/ui, lucide, `src/lib/*-context.tsx` | `src/db/*`, `src/app/api/*` |
| `src/app/**/page.tsx` | components, lib, server/client APIs | DB directly (use API routes) |

### Key Rules
- **Server components** can import from `src/db/` and `src/lib/` (non-context files)
- **Client components** must NOT import from `src/db/` — use API routes via `fetch()`
- **API routes** must NOT import React components
- **Context providers** must NOT import database modules
- **Middleware** runs at the edge — only use edge-compatible imports

---

## Content Generation Rules

### Track 0 & Track 1 Lessons
1. Read the module topic and mapping from `research_synthesis.md` Section 2 (EASA) and Section 4 (Curriculum)
2. Each lesson: 3-5 steps, 10 quiz questions, 10 learning script pages
3. Foundation track content must be accessible to complete beginners
4. Operator certification content must reference specific EASA regulation articles (2019/947, 2019/945)
5. Include a disclaimer on every exam-prep module: "This practice material supplements official EASA training. It does not replace NAA-recognized certification."

### Exam Question Banks
1. Questions must cover all required EASA exam categories proportionally
2. A1/A3 categories: Meteorology (20%), Regulations (25%), Safety (20%), Drone Systems (20%), Human Factors (15%)
3. A2 adds: Performance (15%), Flight Planning (15%) — rebalance other categories accordingly
4. Each question must have exactly 4 options — one correct, three plausible distractors
5. Explanation must state WHY correct answer is right AND identify the specific misconception in each distractor
6. Difficulty distribution: 30% easy, 50% medium, 20% hard

### Existing Track Learning Scripts (Continuing from original PROGRESS.md)
1. Pages 1–7: cover all concepts from `detailed_explanation` and `step_by_step_guide`
2. Pages 8–9: cover every quiz question — explain correct answers AND why wrong options are wrong
3. Page 10: summarize the lesson and connect to the broader track context
4. Technical accuracy for ML/MLOps/Data/Edge domains

---

## Lessons Learned

<!-- This section is append-only. The Ralph Orchestrator adds entries as it encounters and resolves issues. -->
<!-- Format: - **[TASK-X.Y]** Issue description → Resolution -->

