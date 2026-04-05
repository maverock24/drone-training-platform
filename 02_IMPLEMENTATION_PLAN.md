# Implementation & Update Plan — DroneAI Academy

## OTS Drone Training Platform — EASA, AI/Edge, MLOps, Enterprise/Solo

> Based on: `research_synthesis.md` (April 2026)
> Current Stack: Next.js 16.2.1, React 19, Tailwind v4, shadcn/ui, Turso (libSQL), Netlify
> Scope: Evolve the existing 4-track + 20-domain platform into a full OTS Drone Training LMS

---

## Table of Contents

1. [Gap Analysis — Current vs. Target](#1-gap-analysis)
2. [Architecture Evolution](#2-architecture-evolution)
3. [Database Schema Evolution](#3-database-schema-evolution)
4. [Implementation Phases](#4-implementation-phases)
5. [Content Pipeline](#5-content-pipeline)
6. [New Routes & Components](#6-new-routes--components)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Deployment & Infrastructure](#8-deployment--infrastructure)
9. [Risk Register](#9-risk-register)

---

## 1. Gap Analysis

### What We Have (Current Codebase)

| Area | Status | Details |
|---|---|---|
| **Tech Tracks** | ✅ 4 tracks | AI Engineer, MLOps, Data Engineer, Edge AI — JSON-based, rich content |
| **Domain Training** | ✅ 20 domains | Agriculture, maritime, mining, fire, construction, etc. — JSON-based |
| **Auth** | ✅ Basic | Register/login/logout, JWT (jose), bcryptjs password hash, email verify, forgot-password |
| **Progress Tracking** | ⚠️ Client-side only | `ProgressProvider` context — localStorage, no server persistence |
| **UI Framework** | ✅ Solid | shadcn/ui + Tailwind v4, dark mode, responsive, 10+ custom components |
| **Component Library** | ✅ Good | Navbar, footer, learning-script-viewer, lesson-visualizer, terminal-simulator, interactive-architecture, syntax-highlight, glossary-text, circular-progress |
| **Content Delivery** | ✅ Basic | Tab-based lesson viewer (Overview, Steps, Quiz, Hardware, Script) |
| **Supplementary** | ✅ Present | Glossary, hardware guide, grand-project, diary, resources pages |
| **Database** | ⚠️ Minimal | Turso/libSQL, only `users(id, username, password)` table |
| **Deployment** | ✅ Netlify | netlify.toml configured, Docker + docker-compose available |

### What We Need (From Research Synthesis)

| Area | Gap | Priority | Effort |
|---|---|---|---|
| **Track 0: Foundation** | 🔴 Missing entirely | P0 | Medium |
| **Track 1: EASA Operator Certification** | 🔴 Missing entirely | P0 | High |
| **EASA Exam Engine** | 🔴 Missing — timed practice exams mimicking A1/A3, A2 | P0 | High |
| **Roles & Permissions** | 🔴 No RBAC — only basic user | P0 | Medium |
| **Server-side Progress** | 🔴 Client-only, no persistence | P0 | Medium |
| **Payment & Subscriptions** | 🔴 No payment infrastructure | P0 | High |
| **Certificate Generation** | 🟡 Missing — auto-generated PDF on track completion | P1 | Medium |
| **Enterprise Dashboard** | 🟡 Missing — team management, compliance view | P1 | High |
| **Course Catalog / Filtering** | 🟡 Homepage lists tracks/domains but no searchable catalog | P1 | Medium |
| **Multi-language (i18n)** | 🟡 English only — need DE, FR, ES, IT, NL for pan-EU | P1 | High |
| **Discussion Forums** | 🟡 No community features | P1 | Medium |
| **Gamification** | 🟡 No XP, badges, streaks, leaderboards | P1 | Medium |
| **Business Plan Builder** | 🟡 Missing — guided templates for drone business | P1 | Medium |
| **Cloud Gazebo/SITL Labs** | 🟠 Missing — requires compute infra | P2 | Very High |
| **Code Sandbox** | 🟠 Missing — in-browser Jupyter/VSCode | P2 | High |
| **Job Board / Marketplace** | 🟠 Missing | P2 | Medium |
| **Mobile App** | 🟠 Missing — iOS/Android companion | P2 | Very High |
| **Domain mapping to EASA reqs** | 🟡 Domains exist but lack EASA prerequisite linking | P1 | Low |

---

## 2. Architecture Evolution

### 2.1 Current Architecture

```
┌─────────────────────────────────────────┐
│            Netlify (Static + SSR)        │
├─────────────────────────────────────────┤
│  Next.js 16.2.1 (App Router)           │
│  ├── pages (SSR/SSG)                    │
│  ├── API routes (auth only)             │
│  └── Client components (progress, auth) │
├─────────────────────────────────────────┤
│  Turso (libSQL) — users table only      │
├─────────────────────────────────────────┤
│  JSON files — course & domain content   │
└─────────────────────────────────────────┘
```

### 2.2 Target Architecture (Phase 4+)

> **Zero-cost constraint:** Every service below offers a free tier sufficient for launch. Paid tiers only needed once revenue justifies scaling.

```
┌──────────────────────────────────────────────────────────┐
│               Netlify (Free Tier — 100GB BW)             │
├──────────────────────────────────────────────────────────┤
│  Next.js (App Router)                                    │
│  ├── Server Components (course catalog, dashboard)       │
│  ├── API Routes (auth, progress, payments, exams, admin) │
│  ├── Middleware (RBAC, rate limiting, i18n routing)       │
│  └── Client Components (exam engine, code editor)        │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌───────────┐              │
│  │  Turso   │  │ Upstash  │  │  Stripe   │              │
│  │ (libSQL) │  │  Redis   │  │ (billing) │              │
│  │ FREE 9GB │  │ FREE 10k │  │ pay-per-  │              │
│  │ 12 tables│  │ cmd/day  │  │ txn only  │              │
│  └──────────┘  └──────────┘  └───────────┘              │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌────────────────┐  ┌───────────┐        │
│  │ Resend   │  │ Cloudflare R2  │  │ YouTube/  │        │
│  │ (email)  │  │  (assets)      │  │ Bunny.net │        │
│  │ FREE 100 │  │  FREE 10GB     │  │ (video)   │        │
│  │ /day     │  │  +free egress  │  │ embed/free│        │
│  └──────────┘  └────────────────┘  └───────────┘        │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐              │
│  │   Cloud Lab Infrastructure (Phase 6)   │              │
│  │   Docker — Gazebo SITL + JupyterLite   │              │
│  └────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Database** | Stay with Turso (libSQL) | Already integrated, serverless-friendly, scales on Netlify edge. Add tables, not services. |
| **ORM** | Add Drizzle ORM | Type-safe, lightweight, excellent Turso/libSQL support. Replaces raw SQL. |
| **Auth upgrade** | Evolve existing JWT auth → add RBAC middleware | Existing auth works. Add roles column + middleware rather than replacing with NextAuth/Clerk. |
| **Payments** | Stripe | No monthly fee — pay only per transaction (2.9% + €0.25). Zero cost until first sale. |
| **Video hosting** | YouTube (unlisted) / Bunny.net (free trial) | Embed unlisted YouTube for launch (€0). Migrate to Bunny.net Stream ($1/mo per 1TB) at scale. Mux reserved for post-revenue phase. |
| **Email** | Keep Resend (free tier) | 100 emails/day free — sufficient for launch. Already integrated. |
| **i18n** | next-intl | Best Next.js App Router i18n library, supports server/client components, message extraction. Free/OSS. |
| **Content storage** | JSON files → DB-backed content (hybrid) | Keep JSON for existing content, add DB for user-generated content, exam questions, forum posts. |
| **PDF generation** | @react-pdf/renderer | Server-side PDF certificate generation, React-based templates. Free/OSS. |
| **State management** | Server-side progress + React context (optimistic) | Move progress to DB, keep context for optimistic UI updates. |
| **Cache / Rate Limit** | Upstash Redis (free tier) | 10K commands/day free. Session cache + API rate limiting at zero cost. |

---

## 3. Database Schema Evolution

### 3.1 Current Schema

```sql
-- EXISTING (Turso/libSQL)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
```

### 3.2 Target Schema (incremental migrations)

```sql
-- MIGRATION 001: Extend users table
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';
  -- roles: 'student' | 'instructor' | 'enterprise_admin' | 'platform_admin'
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN locale TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN email_verified_at TEXT;
ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT (datetime('now'));

-- MIGRATION 002: Organizations (Enterprise)
CREATE TABLE organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  max_seats INTEGER DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE organization_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  invited_at TEXT DEFAULT (datetime('now')),
  accepted_at TEXT,
  UNIQUE(org_id, user_id)
);

-- MIGRATION 003: Enrollments & Progress (server-side)
CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  track_id TEXT NOT NULL,          -- 'foundation' | 'operator' | 'ai_engineer' | etc.
  enrolled_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  certificate_url TEXT,
  UNIQUE(user_id, track_id)
);

CREATE TABLE lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  track_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed'
  score REAL,                         -- quiz score 0.0-1.0
  completed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, track_id, module_id, lesson_id)
);

-- MIGRATION 004: Exam Engine
CREATE TABLE exam_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  exam_type TEXT NOT NULL,           -- 'a1_a3_practice' | 'a2_practice' | 'sts_practice' | 'module_quiz'
  track_id TEXT,
  module_id TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT,
  score REAL,
  passed INTEGER DEFAULT 0,
  answers_json TEXT,                  -- JSON blob of answers for review
  time_limit_seconds INTEGER,
  time_used_seconds INTEGER
);

CREATE TABLE exam_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_type TEXT NOT NULL,
  category TEXT NOT NULL,            -- 'meteorology' | 'regulations' | 'safety' | etc.
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL,        -- JSON array of option objects
  correct_option_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium',  -- 'easy' | 'medium' | 'hard'
  locale TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now'))
);

-- MIGRATION 005: Payments & Subscriptions
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  org_id INTEGER REFERENCES organizations(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL,                -- 'solo_monthly' | 'solo_annual' | 'pro_monthly' | 'pro_annual' | 'enterprise'
  status TEXT DEFAULT 'active',      -- 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start TEXT,
  current_period_end TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  item_type TEXT NOT NULL,           -- 'course' | 'domain' | 'exam' | 'certificate'
  item_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now'))
);

-- MIGRATION 006: Gamification
CREATE TABLE user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  achievement_id TEXT NOT NULL,      -- 'first_lesson' | 'easa_a1a3' | 'streak_7' | etc.
  earned_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE user_xp_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,              -- 'lesson_complete' | 'quiz_pass' | 'streak' | 'exam_pass'
  source_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- MIGRATION 007: Forum / Community
CREATE TABLE forum_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  track_id TEXT,
  module_id TEXT,
  lesson_id TEXT,
  parent_id INTEGER REFERENCES forum_posts(id),
  title TEXT,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

-- MIGRATION 008: Certificates
CREATE TABLE certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  track_id TEXT NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TEXT DEFAULT (datetime('now')),
  pdf_url TEXT,
  metadata_json TEXT               -- track name, completion date, score, etc.
);
```

### 3.3 Migration Strategy

Use Drizzle Kit for migrations:

```
src/
  db/
    schema.ts          # Drizzle schema definitions
    migrations/        # SQL migration files (auto-generated)
    migrate.ts         # Migration runner
    index.ts           # Drizzle client instance
```

Run migrations via `drizzle-kit push` for Turso. Each phase adds its own migrations.

---

## 4. Implementation Phases

### Phase 1 — P0 Foundation (Weeks 1-4)

**Goal:** Server-side progress, RBAC, database evolution, Drizzle ORM

| Task | File(s) | Description |
|---|---|---|
| 1.1 Install Drizzle ORM | `package.json`, `src/db/` | `drizzle-orm` + `drizzle-kit` + Turso adapter |
| 1.2 Define Drizzle schema | `src/db/schema.ts` | Users (extended), enrollments, lesson_progress tables |
| 1.3 Migration 001-003 | `src/db/migrations/` | Run initial migrations against Turso |
| 1.4 Add role field to auth | `src/lib/auth-context.tsx`, `src/app/api/me/` | Include `role` in JWT payload and auth context |
| 1.5 RBAC middleware | `src/middleware.ts` | Route-level protection: admin routes, enterprise routes, auth-required routes |
| 1.6 Server-side progress API | `src/app/api/progress/` | POST: save lesson progress, GET: fetch user progress, PATCH: update status |
| 1.7 Migrate ProgressProvider | `src/lib/progress-context.tsx` | Hybrid: load from server on auth, fall back to localStorage for anonymous, sync on completion |
| 1.8 Enrollment API | `src/app/api/enrollments/` | POST: enroll in track, GET: list enrollments, track completion status |
| 1.9 User profile update | `src/app/profile/`, `src/app/api/profile/` | Full name, avatar, locale preference, email management |
| 1.10 Dashboard page | `src/app/dashboard/` | Authenticated home: enrolled tracks, progress bars, recent activity, upcoming lessons |

**Dependencies:** None — this is the foundational layer everything else needs.

**Exit Criteria:** 
- User can register, login, enroll in a track, complete lessons, and see persisted progress across devices
- Admin role can be assigned and verified via middleware
- TypeScript compiles, build succeeds, existing functionality unbroken

---

### Phase 2 — Track 0 & Track 1: EASA Content (Weeks 5-8)

**Goal:** Add Foundation and Operator Certification tracks with EASA exam engine

| Task | File(s) | Description |
|---|---|---|
| 2.1 Create Track 0 JSON | `courses/foundation.json` | 4 modules (F.1-F.4): Aviation Fundamentals, Drone Systems, EASA Regulations, Safety & Risk |
| 2.2 Create Track 1 JSON | `courses/operator_certification.json` | 6 modules (O.1-O.6): A1/A3 Prep, A2 Theory, STS-01, STS-02, SORA, Ops Manual Lab |
| 2.3 Update course-data.ts | `src/lib/course-data.ts` | Import new JSON files, add to track registry with metadata (icons, colors, gradients) |
| 2.4 Update homepage | `src/app/page.tsx` | Show 6 tracks (Foundation, Operator, AI, MLOps, Data, Edge) with proper ordering |
| 2.5 EASA Exam question bank | `courses/exams/a1_a3_questions.json`, `courses/exams/a2_questions.json` | 200+ questions per exam type categorized by topic (meteorology, regulations, safety, drone systems) |
| 2.6 Migration 004 | `src/db/migrations/` | exam_attempts, exam_questions tables |
| 2.7 Exam Engine API | `src/app/api/exams/` | POST: start attempt, PATCH: submit answers, GET: results/history |
| 2.8 Practice Exam UI | `src/app/exams/` | Timer, question navigation, answer review, score breakdown by category |
| 2.9 Exam results page | `src/app/exams/[attemptId]/results/` | Detailed breakdown: correct/wrong per category, explanations, retry option |
| 2.10 Domain-EASA linking | `src/lib/domain-data.ts` | Add `prerequisite_tracks` and `easa_category` fields to domain JSON, show prerequisites in domain pages |

**Content Generation Strategy (Track 0 & 1):**

```
courses/
  foundation.json              # Track 0: 4 modules × 3-5 lessons each = ~16 lessons
  operator_certification.json  # Track 1: 6 modules × 3-5 lessons each = ~24 lessons
  exams/
    a1_a3_questions.json       # 200+ questions, categorized
    a2_questions.json          # 200+ questions, categorized
    sts_01_questions.json      # 100+ questions
    sts_02_questions.json      # 100+ questions
```

Each lesson follows the existing JSON structure (overview, steps, quiz, hardware, learning_script) already established in the AI Engineer track.

**Exit Criteria:**
- 6 tracks visible on homepage (Foundation and Operator first in order)
- A1/A3 practice exam works: 40 questions, 75-minute timer, categorized scoring
- A2 practice exam works: 30 questions, 60-minute timer
- All existing track/domain functionality intact

---

### Phase 3 — Payments & Subscriptions (Weeks 9-12)

**Goal:** Monetize with Stripe — subscription tiers + one-time course purchases

| Task | File(s) | Description |
|---|---|---|
| 3.1 Stripe setup | `package.json`, `.env` | Install `stripe`, `@stripe/stripe-js`, configure API keys |
| 3.2 Migration 005 | `src/db/migrations/` | subscriptions, purchases tables |
| 3.3 Stripe webhook handler | `src/app/api/webhooks/stripe/` | Handle checkout.session.completed, subscription.updated, invoice.paid |
| 3.4 Pricing page | `src/app/pricing/` | Three tiers: Solo (€19/mo), Pro (€49/mo), Enterprise (€199/seat/mo) |
| 3.5 Checkout flow | `src/app/api/checkout/` | Stripe Checkout Sessions for subscriptions + one-time purchases |
| 3.6 Access control middleware | `src/middleware.ts` | Extend RBAC: check subscription status for premium content gating |
| 3.7 Content gating | `src/lib/access-control.ts` | Define which tracks/modules are free vs. paid per tier |
| 3.8 Billing portal | `src/app/settings/billing/` | Manage subscription, view invoices, update payment method (Stripe Customer Portal) |
| 3.9 Enterprise billing | `src/app/api/enterprise/` | Seat-based licensing, team invitations, bulk enrollment |
| 3.10 Free tier content | Configuration | Foundation Track (Track 0) free, A1/A3 exam prep free, everything else gated |

**Pricing Model (from Research §6.2):**

| Tier | Monthly | Annual | Includes |
|---|---|---|---|
| **Free** | €0 | €0 | Track 0 (Foundation), A1/A3 exam prep, 1 domain preview |
| **Solo** | €19 | €190/yr | All tracks, all domains, unlimited practice exams, certificates |
| **Pro** | €49 | €490/yr | Solo + cloud labs (Gazebo SITL), code sandbox (JupyterLite), priority forums |
| **Enterprise** | €199/seat | Custom | Pro + team dashboard, compliance reporting, SCORM export, SLA |

**Exit Criteria:**
- Users can subscribe via Stripe Checkout
- Free content is accessible without payment
- Paid content shows upgrade prompt for free users
- Webhook handles subscription lifecycle correctly
- Enterprise can add/remove seats

---

### Phase 4 — Enterprise Features (Weeks 13-16)

**Goal:** Enterprise dashboard, team management, compliance tracking, certificates

| Task | File(s) | Description |
|---|---|---|
| 4.1 Migration 006-008 | `src/db/migrations/` | organizations, org_members, user_achievements, user_xp_log, certificates |
| 4.2 Organization CRUD | `src/app/api/organizations/` | Create org, invite members, manage roles, remove members |
| 4.3 Enterprise dashboard | `src/app/enterprise/` | Team progress overview, compliance status per member, enrollment management |
| 4.4 Team invitation flow | `src/app/enterprise/invite/` | Email invitation via Resend, accept flow, auto-enrollment |
| 4.5 Certificate generation | `src/lib/certificate-generator.ts` | @react-pdf/renderer templates for track completion certificates |
| 4.6 Certificate API | `src/app/api/certificates/` | Generate on track completion, store PDF URL, verify via unique number |
| 4.7 Certificate verification | `src/app/verify/[certificateNumber]/` | Public verification page for employers |
| 4.8 Compliance matrix | `src/app/enterprise/compliance/` | Matrix: team members × required tracks, pass/fail status, due dates |
| 4.9 Activity export | `src/app/api/enterprise/export/` | CSV/JSON export of team progress for HR/compliance systems |
| 4.10 SCORM export (basic) | `src/lib/scorm-export.ts` | Export course structure as SCORM 2004 package for enterprise LMS integration |

**Exit Criteria:**
- Enterprise admin can create organization, invite team, see progress
- Certificates auto-generate on track completion with unique verifiable numbers
- Compliance matrix shows team training status at a glance

---

### Phase 5 — Platform Polish & Growth (Weeks 17-22)

**Goal:** Multi-language, gamification, course catalog, community features

| Task | File(s) | Description |
|---|---|---|
| 5.1 Install next-intl | `package.json`, `src/i18n/` | i18n configuration, message files, locale routing |
| 5.2 Extract strings | `src/messages/{en,de,fr,es,it,nl}.json` | Extract all UI strings to message files |
| 5.3 Localize routes | `src/middleware.ts`, `src/app/[locale]/` | Locale prefix routing, language switcher in navbar |
| 5.4 Course catalog page | `src/app/catalog/` | Searchable, filterable catalog: by track, domain, level, price, language |
| 5.5 Gamification system | `src/lib/gamification.ts`, `src/app/api/xp/` | XP on lesson complete, quiz pass, streak tracking, badge definitions |
| 5.6 Leaderboard | `src/app/leaderboard/` | Weekly/monthly/all-time leaderboards, friend comparisons |
| 5.7 Achievement badges | `src/components/achievement-badge.tsx` | Badge gallery on profile, toast notifications on earn |
| 5.8 Discussion forums | `src/app/forums/` | Per-lesson discussions, upvoting, instructor answers marked |
| 5.9 Student portfolio | `src/app/portfolio/[userId]/` | Public profile: completed tracks, certificates, badges, XP |
| 5.10 Business plan builder | `src/app/tools/business-plan/` | Guided wizard: pick domain → input/output, revenue estimator, equipment list |
| 5.11 Equipment recommender | `src/app/tools/equipment/` | Filter by domain + budget → recommended drone/sensor/software stack |
| 5.12 Notification system | `src/app/api/notifications/`, `src/components/notification-bell.tsx` | In-app notifications for achievements, forum replies, enrollment reminders |
| 5.13 Streak tracking | `src/lib/streaks.ts` | Daily login streak, study streak, email reminders for streak preservation |

**Exit Criteria:**
- Platform available in EN + DE (minimum), FR/ES/IT/NL content placeholders
- Users earn XP and badges, see leaderboard
- Forums active per lesson with moderation tools
- Business plan builder produces downloadable PDF

---

### Phase 6 — Cloud Lab Infrastructure (Weeks 23-30)

**Goal:** Cloud Gazebo SITL labs and code sandbox for hands-on programming tracks

> **Note:** Browser-based flight simulator (Three.js/WebGL) is out of scope for now. Re-evaluate once revenue from Phases 1-5 justifies the development investment.

| Task | File(s) | Description |
|---|---|---|
| 6.1 Cloud Gazebo SITL | `infra/gazebo/` | Docker containers with PX4-SITL + Gazebo, accessed via WebSocket/noVNC |
| 6.2 Lab session manager | `src/app/api/labs/` | Spin up/down cloud lab instances, usage tracking |
| 6.3 Code sandbox integration | `src/app/labs/code/` | JupyterLite (zero-server, runs in browser) or code-server embedded in iframe |
| 6.4 Hardware-in-the-loop | `infra/hil/` | Remote access to physical Jetson + Pixhawk rigs via WebRTC |
| 6.5 Lab booking system | `src/app/labs/book/` | Calendar-based booking for HIL lab time slots |
| 6.6 Lab compute pricing | Configuration | Pay-per-hour compute (€0.50/hr Gazebo, €2/hr HIL) or included in Pro+ tiers |

**Infrastructure Requirements:**
- Hetzner Cloud (cheapest EU compute: CX22 €4.35/mo) or Oracle Cloud free ARM instances for Gazebo SITL
- Docker Compose for initial orchestration (K8s deferred until 10+ concurrent users)
- noVNC for browser-based access to headful applications
- Cloudflare R2 (free 10GB) for saving lab state and student work
- JupyterLite for zero-cost in-browser Python/notebook environment (no server needed)

**Exit Criteria:**
- Cloud Gazebo lab can be launched and accessed from course pages
- JupyterLite sandbox runs ROS2/PX4 code exercises in-browser
- Compute usage is tracked and billed correctly

---

## 5. Content Pipeline

### 5.1 Existing Content (Keep & Enhance)

| Track | Lessons | Learning Scripts | Status |
|---|---|---|---|
| AI Engineer | 8 | 4 complete, 4 pending | Continue from PROGRESS.md Phase 2 |
| MLOps Engineer | 6 | 0 complete | Continue from PROGRESS.md Phase 3 |
| Data Engineer | 5 | 0 complete | Continue from PROGRESS.md Phase 4 |
| Edge AI Engineer | 6 | 0 complete | Continue from PROGRESS.md Phase 5 |
| **Domain Training** | 20 domains | N/A (different format) | Enhance with EASA prerequisites |

### 5.2 New Content to Create

| Content | Format | Estimated Size | Phase |
|---|---|---|---|
| Track 0: Foundation | JSON (same schema as existing tracks) | 4 modules, ~16 lessons, ~160 learning script pages | Phase 2 |
| Track 1: Operator Cert | JSON (same schema) | 6 modules, ~24 lessons, ~240 learning script pages | Phase 2 |
| EASA A1/A3 Question Bank | JSON (exam_questions format) | 200+ questions, 5 categories | Phase 2 |
| EASA A2 Question Bank | JSON (exam_questions format) | 200+ questions, 5 categories | Phase 2 |
| STS-01/02 Question Banks | JSON (exam_questions format) | 100+ questions each | Phase 2 |
| Domain prerequisite mappings | JSON field additions | 20 domain files updated | Phase 2 |
| i18n message files (DE, FR) | JSON message dictionaries | ~2000 strings × 2 languages | Phase 5 |
| ~~Simulator scenarios~~ | ~~JSON + 3D assets~~ | ~~Out of scope~~ | ~~—~~ |

### 5.3 Content JSON Schema (Track 0/1)

Same structure as existing tracks to maintain compatibility:

```typescript
// foundation.json / operator_certification.json
{
  "id": "foundation",
  "title": "Foundation — Aviation & EASA Fundamentals",
  "description": "...",
  "modules": [
    {
      "id": "aviation-fundamentals",
      "title": "Aviation Fundamentals",
      "lessons": [
        {
          "id": "airspace-classification",
          "title": "European Airspace Classification",
          "overview": "...",
          "steps": [...],         // Existing Step[] schema
          "quiz": [...],          // Existing Quiz[] schema
          "hardware": [...],      // Optional
          "learning_script": [...] // LearningScriptPage[] schema
        }
      ]
    }
  ]
}
```

### 5.4 Content Generation Tasks (Autonomous Agent)

The Ralph Orchestrator can generate Track 0 and Track 1 content using the same pattern established in PROGRESS.md. Recommended split:

```
Phase 2 Content Tasks:
├── TASK-C.1: Generate foundation.json — Module F.1 (4 lessons)
├── TASK-C.2: Generate foundation.json — Module F.2 (4 lessons)
├── TASK-C.3: Generate foundation.json — Module F.3 (4 lessons)
├── TASK-C.4: Generate foundation.json — Module F.4 (4 lessons)
├── TASK-C.5: Generate operator_certification.json — Module O.1 (5 lessons)
├── TASK-C.6: Generate operator_certification.json — Module O.2 (5 lessons)
├── TASK-C.7: Generate operator_certification.json — Module O.3 (4 lessons)
├── TASK-C.8: Generate operator_certification.json — Module O.4 (4 lessons)
├── TASK-C.9: Generate operator_certification.json — Module O.5 (3 lessons)
├── TASK-C.10: Generate operator_certification.json — Module O.6 (3 lessons)
├── TASK-C.11: Generate a1_a3_questions.json (200+ questions)
├── TASK-C.12: Generate a2_questions.json (200+ questions)
├── TASK-C.13: Generate sts_01_questions.json (100+ questions)
└── TASK-C.14: Generate sts_02_questions.json (100+ questions)
```

---

## 6. New Routes & Components

### 6.1 New Pages (by Phase)

```
Phase 1:
  src/app/dashboard/page.tsx              # Authenticated dashboard
  src/app/api/progress/route.ts           # Progress CRUD API
  src/app/api/enrollments/route.ts        # Enrollment API
  src/app/api/profile/route.ts            # Profile update API

Phase 2:
  src/app/exams/page.tsx                  # Exam catalog (A1/A3, A2, STS)
  src/app/exams/[examType]/page.tsx       # Start exam page
  src/app/exams/[examType]/attempt/page.tsx  # Active exam (timer, questions)
  src/app/exams/[attemptId]/results/page.tsx # Results breakdown

Phase 3:
  src/app/pricing/page.tsx                # Pricing tiers page
  src/app/api/checkout/route.ts           # Stripe Checkout creation
  src/app/api/webhooks/stripe/route.ts    # Stripe webhook handler
  src/app/settings/billing/page.tsx       # Billing management

Phase 4:
  src/app/enterprise/page.tsx             # Enterprise dashboard
  src/app/enterprise/team/page.tsx        # Team management
  src/app/enterprise/invite/page.tsx      # Invitation flow
  src/app/enterprise/compliance/page.tsx  # Compliance matrix
  src/app/verify/[certificateNumber]/page.tsx  # Public cert verification
  src/app/api/organizations/route.ts
  src/app/api/certificates/route.ts

Phase 5:
  src/app/[locale]/layout.tsx             # i18n root layout
  src/app/catalog/page.tsx                # Course catalog with filters
  src/app/leaderboard/page.tsx            # Gamification leaderboard
  src/app/forums/page.tsx                 # Discussion forum index
  src/app/forums/[trackId]/[lessonId]/page.tsx  # Per-lesson discussion
  src/app/portfolio/[userId]/page.tsx     # Public student portfolio
  src/app/tools/business-plan/page.tsx    # Business plan builder
  src/app/tools/equipment/page.tsx        # Equipment recommender

Phase 6:
  src/app/labs/page.tsx                   # Lab catalog
  src/app/labs/code/page.tsx              # Code sandbox (JupyterLite)
  src/app/labs/book/page.tsx              # Lab booking
```

### 6.2 New Components

```
Phase 1:
  src/components/dashboard-card.tsx        # Track progress card for dashboard
  src/components/enrollment-button.tsx     # "Enroll" CTA with auth check

Phase 2:
  src/components/exam-timer.tsx            # Countdown timer with pause/resume
  src/components/exam-question.tsx         # Single question with radio options
  src/components/exam-navigator.tsx        # Question grid navigation (flagged, answered, unanswered)
  src/components/exam-results-chart.tsx    # Radar/bar chart of category scores
  src/components/easa-badge.tsx            # Visual badge for EASA category (A1/A2/A3/STS)

Phase 3:
  src/components/pricing-card.tsx          # Tier pricing card
  src/components/paywall.tsx               # Content gate CTA for free users
  src/components/subscription-status.tsx   # Current plan indicator

Phase 4:
  src/components/certificate-card.tsx      # Certificate display/download card
  src/components/team-member-row.tsx       # Enterprise team member row
  src/components/compliance-cell.tsx       # Status cell for compliance matrix

Phase 5:
  src/components/language-switcher.tsx     # Locale selector dropdown
  src/components/achievement-badge.tsx     # Badge icon + tooltip
  src/components/xp-bar.tsx               # XP progress bar with level
  src/components/streak-counter.tsx        # Daily streak flame icon
  src/components/forum-post.tsx            # Forum post card with upvote
  src/components/notification-bell.tsx     # Notification dropdown

Phase 6:
  src/components/lab-session.tsx           # Embedded lab iframe + controls
```

---

## 7. Third-Party Integrations

### 7.1 New Dependencies (by Phase)

```json
// Phase 1
"drizzle-orm": "latest",
"drizzle-kit": "latest" (devDependency),

// Phase 2
(no new deps — exam engine uses existing UI components + new API routes)

// Phase 3
"stripe": "latest",
"@stripe/stripe-js": "latest",

// Phase 4
"@react-pdf/renderer": "latest",

// Phase 5
"next-intl": "latest",

// Phase 6
(no new paid deps — JupyterLite loaded via CDN, noVNC via npm)
```

### 7.2 External Services — Zero-Cost Launch Stack

All services below operate within free tiers at launch. Paid upgrades only when revenue demands scaling.

| Service | Purpose | Phase | Free Tier Limits | Paid Upgrade Trigger |
|---|---|---|---|---|
| **Netlify** (existing) | Hosting, SSR, serverless functions | All | 100GB BW, 300 build min/mo | >100GB BW/mo |
| **Turso** (existing) | Primary database | 1 | 9GB storage, 500 DBs, 1B row reads/mo | >9GB storage |
| **Resend** (existing) | Transactional email | 1 | 100 emails/day, 3,000/mo | >100 emails/day |
| **Stripe** | Payments, subscriptions | 3 | No monthly fee — 2.9% + €0.25/txn | N/A (pay-per-use) |
| **Upstash Redis** | Session cache, rate limiting | 1 | 10K commands/day, 256MB | >10K cmd/day |
| **Cloudflare R2** | Asset storage (PDFs, certs) | 4 | 10GB storage, free egress | >10GB storage |
| **YouTube** (unlisted) | Video hosting for lessons | 2 | Unlimited (unlisted videos) | Switch to Bunny.net when analytics needed |
| **JupyterLite** | In-browser code sandbox | 6 | Fully client-side, zero cost | N/A (runs in browser) |
| **Hetzner Cloud** | Gazebo SITL compute | 6 | — (starts at €4.35/mo CX22) | Only when labs feature launched |
| **Oracle Cloud** (alternative) | ARM compute for labs | 6 | 4 Ampere A1 cores, 24GB RAM free forever | >4 cores |

**Total launch cost: €0/mo** (excluding Stripe per-transaction fees once payments are live)

---

## 8. Deployment & Infrastructure

### 8.1 Current Deployment

- **Netlify** — Next.js SSR + static assets
- `netlify.toml` configured
- Docker + docker-compose available (not currently used for deployment)

### 8.2 Deployment Evolution

| Phase | Change | Details |
|---|---|---|
| 1-4 | Keep Netlify | All new features (API routes, middleware) work on Netlify serverless |
| 3 | Add Stripe webhook endpoint | Configure Stripe webhook URL to `https://domain/api/webhooks/stripe` |
| 4 | Add Cloudflare R2 (free 10GB) | Store generated certificate PDFs and user uploads |
| 5 | Add Upstash Redis (free 10K/day) | Rate limiting for API routes, session caching |
| 6 | Add Hetzner/Oracle Cloud | Minimal compute for Gazebo SITL labs (defer until revenue) |
| 6 | Docker Compose orchestration | Scale to K8s only when >10 concurrent lab users |

### 8.3 Environment Variables (New)

```env
# Phase 1
DRIZZLE_DATABASE_URL=          # Same as existing TURSO_DATABASE_URL

# Phase 3
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Phase 4 (Cloudflare R2 — free 10GB)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=

# Phase 5 (Upstash Redis — free 10K cmd/day)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Phase 6 (deferred until revenue)
GAZEBO_API_URL=                # Internal API for lab orchestration
LAB_MAX_CONCURRENT_SESSIONS=
```

---

## 9. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **EASA content accuracy** | High — incorrect regulatory info damages credibility | Medium | Cross-reference all content with official EASA sources, add disclaimer, partner with NAA entity for review |
| **Turso scaling** | Medium — large exam question banks + progress data | Low | Turso handles millions of rows; monitor and upgrade to Scaler plan if needed |
| **Stripe compliance (EU)** | Medium — SCA/PSD2 requirements | Low | Stripe handles SCA automatically, use Stripe Checkout (not custom forms) |
| **i18n content quality** | Medium — machine translation unacceptable for aviation training | Medium | Use professional translators for Track 0/1 (safety-critical), AI-assisted for others |
| **Gazebo lab costs** | Medium — compute costs money | Low | Defer Phase 6 until revenue. Use Oracle Cloud free ARM tier (4 cores, 24GB) for initial labs. Hetzner CX22 at €4.35/mo as fallback. |
| **Content generation volume** | Medium — ~40 new lessons + 600+ exam questions | Medium | Use autonomous agent (Ralph Orchestrator) for draft generation, human QA for final review |
| **Free tier limits** | Low — may hit Turso/Resend/Upstash limits | Low | All free tiers generous for launch traffic. Monitor usage; upgrade only specific service that hits ceiling. |
| **GDPR compliance** | High — EU platform handling user data | Low | Turso EU region, Stripe EU, explicit consent flows, data export/deletion API |

---

## Appendix A: Priority Ordering Summary

```
Phase 1 (Weeks 1-4)   P0  → Foundation: Drizzle, RBAC, progress persistence, dashboard
Phase 2 (Weeks 5-8)   P0  → EASA tracks + exam engine (THE key differentiator)
Phase 3 (Weeks 9-12)  P0  → Payments (monetization unblocked)
Phase 4 (Weeks 13-16) P1  → Enterprise features + certificates
Phase 5 (Weeks 17-22) P1  → i18n, gamification, community, business tools
Phase 6 (Weeks 23-30) P2  → Cloud labs + code sandbox (deferred until revenue)
```

## Appendix B: Existing PROGRESS.md Alignment

The learning script generation tasks in [PROGRESS.md](PROGRESS.md) (Phases 2-5) should continue in parallel with Phase 1-2 of this plan. They are independent workstreams:

- **PROGRESS.md Phases 2-5:** Complete learning scripts for existing 4 tracks (AI, MLOps, Data, Edge) — 21 remaining tasks
- **This Plan Phase 1:** Database/auth/progress foundation — no content dependency
- **This Plan Phase 2:** New Track 0/1 content + exam engine — can run after Phase 1

**Recommended parallelization:**
```
Week 1-4:  [PROGRESS.md Phase 2-5 content] + [Plan Phase 1 infrastructure]
Week 5-8:  [Plan Phase 2: Track 0/1 + exams]
Week 9-12: [Plan Phase 3: Payments]
Week 13+:  [Plan Phase 4-6]
```

## Appendix C: Command Reference

```bash
# Install new dependencies (Phase 1)
npm install drizzle-orm
npm install -D drizzle-kit

# Run migrations
npx drizzle-kit push

# Install Stripe (Phase 3)
npm install stripe @stripe/stripe-js

# Install PDF generator (Phase 4)
npm install @react-pdf/renderer

# Install i18n (Phase 5)
npm install next-intl

# Phase 6 — no upfront deps (JupyterLite via CDN, noVNC via npm when needed)

# Build verification
npx tsc --noEmit && npm run build
```
