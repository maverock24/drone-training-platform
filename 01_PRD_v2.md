# Product Requirements Document — DroneAI Academy v2

## OTS Drone Training Platform — EASA, AI/Edge, MLOps, Enterprise/Solo

> Version: 2.0 — Supersedes original 01_PRD.md (learning scripts only)
> Based on: `02_IMPLEMENTATION_PLAN.md` + `research_synthesis.md` (April 2026)
> Zero-cost constraint: All infrastructure operates within free tiers at launch

---

## 1. Executive Summary

DroneAI Academy is an OTS (Off-The-Shelf) European drone training platform that uniquely combines **EASA regulatory certification training**, **advanced autonomous drone engineering** (ROS2, PX4, Jetson, PyTorch, MLOps), and **domain-specific business launch training** into a single self-paced LMS.

**Strategic differentiation:** No existing competitor combines all three pillars. DroneLicense.eu/Droniq cover regulation only. EdYoda covers tech only. Coptrz covers domains only and is UK-only. DroneAI Academy fills the entire pipeline: regulatory → technical → business.

**Current state:** The platform already has 4 technical tracks (AI Engineer, MLOps, Data Engineer, Edge AI), 20 domain training modules, basic JWT auth, and a client-side progress system deployed on Netlify. This PRD defines the evolution to a full revenue-generating LMS.

---

## 2. System Architecture

### 2.1 Tech Stack

| Layer | Technology | Version | Cost |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 | Free/OSS |
| Runtime | React | 19.2.4 | Free/OSS |
| Styling | Tailwind CSS v4 | via `@tailwindcss/postcss` | Free/OSS |
| Components | shadcn/ui | v4.1.1 | Free/OSS |
| Icons | lucide-react | 1.7.0 | Free/OSS |
| Language | TypeScript | 5.x (strict mode) | Free/OSS |
| ORM | Drizzle ORM | latest | Free/OSS |
| Database | Turso (libSQL) | — | Free tier: 9GB, 1B reads/mo |
| Auth | Custom JWT (jose) + bcryptjs | jose 6.2.2 | Free/OSS |
| Email | Resend | 6.9.4 | Free tier: 100/day |
| Payments | Stripe | latest | Pay-per-txn only (2.9%+€0.25) |
| Cache | Upstash Redis | — | Free tier: 10K cmd/day |
| Asset Storage | Cloudflare R2 | — | Free tier: 10GB + free egress |
| PDF Generation | @react-pdf/renderer | latest | Free/OSS |
| i18n | next-intl | latest | Free/OSS |
| Video | YouTube (unlisted embeds) | — | Free |
| Code Sandbox | JupyterLite | — | Free (client-side, no server) |
| Hosting | Netlify | — | Free tier: 100GB BW |

**Total launch cost: €0/mo** (excluding Stripe per-transaction fees once payments are live)

### 2.2 Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│               Netlify (Free Tier — 100GB BW)             │
├──────────────────────────────────────────────────────────┤
│  Next.js 16 (App Router)                                 │
│  ├── Server Components (catalog, dashboard, enterprise)  │
│  ├── API Routes (auth, progress, exams, payments, admin) │
│  ├── Middleware (RBAC, rate limiting, i18n routing)       │
│  └── Client Components (exam engine, code editor, forms) │
├──────────────────────────────────────────────────────────┤
│  Turso (9GB)  │  Upstash Redis (10K/d)  │  Stripe (txn)  │
├──────────────────────────────────────────────────────────┤
│  Resend (100/d)  │  Cloudflare R2 (10GB)  │  YouTube      │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Component Hierarchy

### 3.1 Existing Components (Preserve)

```
src/components/
├── navbar.tsx                    # Global navigation
├── footer.tsx                    # Global footer
├── circular-progress.tsx         # Track progress rings
├── glossary-text.tsx            # In-line glossary tooltips
├── interactive-architecture.tsx  # Architecture diagrams
├── learning-script-viewer.tsx   # 10-page learning script reader
├── lesson-visualizer.tsx        # Step-by-step visualization
├── syntax-highlight.tsx         # Code syntax highlighting
├── terminal-simulator.tsx       # Interactive terminal
└── ui/                          # shadcn/ui primitives
```

### 3.2 New Components (by Phase)

```
Phase 1 — Foundation:
├── dashboard-card.tsx            # Track progress card for authenticated dashboard
└── enrollment-button.tsx         # "Enroll" CTA with auth check

Phase 2 — EASA & Exams:
├── exam-timer.tsx               # Countdown timer with pause/resume
├── exam-question.tsx            # Single MCQ with radio options
├── exam-navigator.tsx           # Question grid (flagged/answered/unanswered)
├── exam-results-chart.tsx       # Category score radar/bar chart
└── easa-badge.tsx               # Visual badge (A1/A2/A3/STS)

Phase 3 — Payments:
├── pricing-card.tsx             # Subscription tier card
├── paywall.tsx                  # Content gate CTA for free users
└── subscription-status.tsx      # Current plan indicator

Phase 4 — Enterprise:
├── certificate-card.tsx         # Certificate display/download
├── team-member-row.tsx          # Enterprise team member row
└── compliance-cell.tsx          # Status cell for compliance matrix

Phase 5 — Growth:
├── language-switcher.tsx        # Locale selector dropdown
├── achievement-badge.tsx        # Badge icon + tooltip
├── xp-bar.tsx                   # XP progress bar with level
├── streak-counter.tsx           # Daily streak flame icon
├── forum-post.tsx               # Forum post card with upvote
└── notification-bell.tsx        # Notification dropdown

Phase 6 — Labs:
└── lab-session.tsx              # Embedded lab iframe + controls
```

### 3.3 Page Routes

```
EXISTING:
/                                 # Landing page (6 tracks + 20 domains)
/tracks/[trackId]/[moduleId]/[lessonId]  # Lesson viewer (5 tabs)
/domains/[domainId]               # Domain training page
/glossary                         # Glossary
/hardware                         # Hardware guide
/grand-project                    # Capstone project
/profile                          # User profile
/diary                            # Learning diary
/resources                        # External resources
/login, /register, /forgot-password, /reset-password

NEW:
/dashboard                        # Authenticated home (Phase 1)
/exams                            # Exam catalog (Phase 2)
/exams/[examType]                 # Start exam (Phase 2)
/exams/[examType]/attempt         # Active exam session (Phase 2)
/exams/[attemptId]/results        # Exam results breakdown (Phase 2)
/pricing                          # Subscription tiers (Phase 3)
/settings/billing                 # Billing management (Phase 3)
/enterprise                       # Enterprise dashboard (Phase 4)
/enterprise/team                  # Team management (Phase 4)
/enterprise/invite                # Invitation flow (Phase 4)
/enterprise/compliance            # Compliance matrix (Phase 4)
/verify/[certificateNumber]       # Public cert verification (Phase 4)
/catalog                          # Course catalog with filters (Phase 5)
/leaderboard                      # Gamification leaderboard (Phase 5)
/forums                           # Forum index (Phase 5)
/forums/[trackId]/[lessonId]      # Per-lesson discussion (Phase 5)
/portfolio/[userId]               # Public student portfolio (Phase 5)
/tools/business-plan              # Business plan builder (Phase 5)
/tools/equipment                  # Equipment recommender (Phase 5)
/labs                             # Lab catalog (Phase 6)
/labs/code                        # Code sandbox - JupyterLite (Phase 6)
/labs/book                        # Lab booking (Phase 6)
```

---

## 4. Data Model

### 4.1 Existing Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT
);
```

### 4.2 Target Schema (8 Migrations)

**Migration 001 — Extend users:**
```sql
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';
  -- 'student' | 'instructor' | 'enterprise_admin' | 'platform_admin'
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN locale TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN email_verified_at TEXT;
ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT (datetime('now'));
```

**Migration 002 — Organizations (Enterprise):**
```sql
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
```

**Migration 003 — Enrollments & Progress:**
```sql
CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  track_id TEXT NOT NULL,
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
  status TEXT DEFAULT 'not_started',
  score REAL,
  completed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, track_id, module_id, lesson_id)
);
```

**Migration 004 — Exam Engine:**
```sql
CREATE TABLE exam_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  exam_type TEXT NOT NULL,
  track_id TEXT,
  module_id TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT,
  score REAL,
  passed INTEGER DEFAULT 0,
  answers_json TEXT,
  time_limit_seconds INTEGER,
  time_used_seconds INTEGER
);

CREATE TABLE exam_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_type TEXT NOT NULL,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_option_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium',
  locale TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Migration 005 — Payments & Subscriptions:**
```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  org_id INTEGER REFERENCES organizations(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Migration 006 — Gamification:**
```sql
CREATE TABLE user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  achievement_id TEXT NOT NULL,
  earned_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE user_xp_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Migration 007 — Forum / Community:**
```sql
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
```

**Migration 008 — Certificates:**
```sql
CREATE TABLE certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  track_id TEXT NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TEXT DEFAULT (datetime('now')),
  pdf_url TEXT,
  metadata_json TEXT
);
```

### 4.3 Content Data Model (JSON)

Existing tracks use this TypeScript schema (unchanged):
```typescript
interface LearningScriptPage { page: number; title: string; content: string; key_takeaways: string[]; }
interface Step { step: number; title: string; description: string; code?: string; }
interface QuizQuestion { question: string; options: string[]; answer: string; }
interface Lesson { id: string; title: string; detailed_explanation: string; step_by_step_guide: Step[]; quiz: QuizQuestion[]; learning_script?: LearningScriptPage[]; }
interface Module { id: string; title: string; description: string; lessons: Lesson[]; }
interface Track { id: string; title: string; shortTitle: string; description: string; prerequisites: string; icon: string; color: string; gradient: string; modules: Module[]; lecture?: string; }
```

New tracks (Foundation, Operator Certification) use the identical schema for compatibility.

New exam question bank schema (stored as JSON files loaded at build time):
```typescript
interface ExamQuestion {
  id: string;
  exam_type: string;           // 'a1_a3' | 'a2' | 'sts_01' | 'sts_02'
  category: string;            // 'meteorology' | 'regulations' | 'safety' | 'drone_systems' | 'human_factors'
  question_text: string;
  options: { label: string; text: string }[];
  correct_option_index: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
```

---

## 5. API Contracts

### 5.1 Progress API (Phase 1)

**POST `/api/progress`** — Save lesson progress
```
Request:  { track_id: string, module_id: string, lesson_id: string, status: 'in_progress' | 'completed', score?: number }
Response: { success: true, progress: LessonProgress }
Auth:     Required (JWT)
```

**GET `/api/progress`** — Fetch all user progress
```
Response: { progress: LessonProgress[], enrollments: Enrollment[] }
Auth:     Required (JWT)
```

**PATCH `/api/progress`** — Update progress status
```
Request:  { id: number, status: string, score?: number }
Response: { success: true, progress: LessonProgress }
Auth:     Required (JWT)
```

### 5.2 Enrollment API (Phase 1)

**POST `/api/enrollments`** — Enroll in track
```
Request:  { track_id: string }
Response: { success: true, enrollment: Enrollment }
Auth:     Required (JWT)
Errors:   409 already enrolled, 403 subscription required (paid tracks)
```

**GET `/api/enrollments`** — List user enrollments
```
Response: { enrollments: Enrollment[] }
Auth:     Required (JWT)
```

### 5.3 Profile API (Phase 1)

**PATCH `/api/profile`** — Update user profile
```
Request:  { full_name?: string, avatar_url?: string, locale?: string }
Response: { success: true, user: User }
Auth:     Required (JWT)
```

### 5.4 Exam API (Phase 2)

**POST `/api/exams/start`** — Start exam attempt
```
Request:  { exam_type: string, question_count?: number }
Response: { attempt_id: number, questions: ExamQuestion[], time_limit_seconds: number }
Auth:     Required (JWT)
```

**PATCH `/api/exams/[attemptId]/submit`** — Submit exam answers
```
Request:  { answers: { question_id: string, selected_index: number }[], time_used_seconds: number }
Response: { score: number, passed: boolean, results_by_category: { category: string, correct: number, total: number }[] }
Auth:     Required (JWT)
```

**GET `/api/exams/history`** — Exam attempt history
```
Response: { attempts: ExamAttempt[] }
Auth:     Required (JWT)
```

### 5.5 Checkout API (Phase 3)

**POST `/api/checkout`** — Create Stripe Checkout session
```
Request:  { plan: 'solo_monthly' | 'solo_annual' | 'pro_monthly' | 'pro_annual' | 'enterprise', quantity?: number }
Response: { checkout_url: string }
Auth:     Required (JWT)
```

**POST `/api/webhooks/stripe`** — Stripe webhook handler
```
Events:   checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid
Auth:     Stripe signature verification
```

### 5.6 Organization API (Phase 4)

**POST `/api/organizations`** — Create organization
```
Request:  { name: string, slug: string }
Response: { success: true, organization: Organization }
Auth:     Required (JWT, role: enterprise_admin)
```

**POST `/api/organizations/[orgId]/invite`** — Invite team member
```
Request:  { email: string, role?: string }
Response: { success: true, invitation_id: number }
Auth:     Required (JWT, org_role: owner | admin)
```

**GET `/api/organizations/[orgId]/members`** — List members + progress
```
Response: { members: OrgMember[], progress_summary: ProgressSummary[] }
Auth:     Required (JWT, org_role: owner | admin)
```

### 5.7 Certificate API (Phase 4)

**POST `/api/certificates`** — Generate certificate (auto-triggered on track completion)
```
Request:  { track_id: string }
Response: { certificate_number: string, pdf_url: string }
Auth:     Required (JWT)
Precondition: All lessons in track completed
```

**GET `/api/certificates/verify/[number]`** — Public verification
```
Response: { valid: boolean, holder_name: string, track_name: string, issued_at: string }
Auth:     None (public)
```

---

## 6. Track & Content Architecture

### 6.1 Track Registry (6 Tracks)

| # | Track ID | Title | Modules | Lessons | Free/Paid | Phase |
|---|---|---|---|---|---|---|
| 0 | `foundation` | Foundation — Aviation & EASA Fundamentals | 4 (F.1-F.4) | ~16 | **Free** | 2 |
| 1 | `operator` | EASA Operator Certification | 6 (O.1-O.6) | ~24 | Paid (Solo+) | 2 |
| 2 | `ai-engineer` | AI Engineer (Generalist) | 8 | 8 | Paid (Solo+) | Existing |
| 3 | `mlops-engineer` | MLOps Engineer | 6 | 6 | Paid (Solo+) | Existing |
| 4 | `data-engineer` | Data Engineer (Geospatial & Sensor Fusion) | 5 | 5 | Paid (Solo+) | Existing |
| 5 | `edge-ai` | Edge AI Engineer | 6 | 6 | Paid (Solo+) | Existing |

### 6.2 Domain Training (20 Domains — Existing)

All 20 domain JSON files (agriculture, bird, city, coastal, construction, culture, emergency, facility_inspection, film, fire, forestry, maritime, mining, oil_gas, package_delivery, polar, power, public_safety, security, viticulture) remain unchanged. Phase 2 adds `prerequisite_tracks` and `easa_category` fields to link domains to EASA requirements.

### 6.3 Exam Question Banks (Phase 2)

| Exam | File | Questions | Categories | Timer |
|---|---|---|---|---|
| EASA A1/A3 | `courses/exams/a1_a3_questions.json` | 200+ | Meteorology, Regulations, Safety, Drone Systems, Human Factors | 75 min / 40 Qs |
| EASA A2 | `courses/exams/a2_questions.json` | 200+ | Same + Performance, Flight Planning | 60 min / 30 Qs |
| STS-01 | `courses/exams/sts_01_questions.json` | 100+ | STS-01 VLOS Urban specific | 45 min / 25 Qs |
| STS-02 | `courses/exams/sts_02_questions.json` | 100+ | STS-02 BVLOS Rural specific | 45 min / 25 Qs |

---

## 7. Acceptance Criteria

### Phase 1 — Foundation (P0)
- [ ] Drizzle ORM installed and connected to Turso
- [ ] Migrations 001-003 applied successfully
- [ ] User `role` field in JWT, returned by `/api/me`
- [ ] RBAC middleware blocks unauthenticated users from `/dashboard`, `/api/progress`
- [ ] `POST /api/progress` persists lesson completion to `lesson_progress` table
- [ ] `GET /api/progress` returns all progress for authenticated user
- [ ] ProgressProvider loads from server when authenticated, falls back to localStorage otherwise
- [ ] Enrollment API creates/reads enrollment records
- [ ] Dashboard page shows enrolled tracks with progress bars
- [ ] Profile page allows editing full_name, avatar, locale
- [ ] All existing functionality (tracks, domains, glossary, etc.) unbroken
- [ ] `npx tsc --noEmit` passes, `npm run build` succeeds

### Phase 2 — EASA Tracks & Exam Engine (P0)
- [ ] `courses/foundation.json` contains 4 modules, ~16 lessons with learning scripts
- [ ] `courses/operator_certification.json` contains 6 modules, ~24 lessons with learning scripts
- [ ] Homepage shows 6 tracks in order: Foundation, Operator, AI, MLOps, Data, Edge
- [ ] Foundation track is accessible without subscription
- [ ] A1/A3 practice exam: 40 random questions, 75-minute timer, category scoring, 75% pass threshold
- [ ] A2 practice exam: 30 random questions, 60-minute timer, 75% pass threshold
- [ ] Exam results page shows category breakdown, explanations, retry button
- [ ] Exam history page shows all past attempts with scores
- [ ] Domain pages show EASA prerequisite badges
- [ ] All 20 domain JSON files updated with `prerequisite_tracks` field

### Phase 3 — Payments (P0)
- [ ] Stripe Checkout creates subscription for Solo/Pro/Enterprise plans
- [ ] Webhook handler processes `checkout.session.completed`, `subscription.updated`, `subscription.deleted`
- [ ] Free users see paywall CTA on paid content
- [ ] Paid users access all tracks and domains
- [ ] Pricing page renders 4 tiers: Free, Solo (€19/mo), Pro (€49/mo), Enterprise (€199/seat)
- [ ] Billing settings page opens Stripe Customer Portal
- [ ] Enterprise admin can purchase multiple seats

### Phase 4 — Enterprise & Certificates (P1)
- [ ] Organization CRUD API works (create, invite, list members)
- [ ] Team invitation via Resend email with accept flow
- [ ] Enterprise dashboard shows team progress overview
- [ ] Compliance matrix: members × required tracks grid
- [ ] Certificates auto-generate on track completion with unique verifiable number
- [ ] `/verify/[number]` public page confirms certificate validity
- [ ] PDF certificate generated via @react-pdf/renderer and stored on R2
- [ ] CSV export of team progress

### Phase 5 — Growth (P1)
- [ ] `next-intl` configured with EN + DE message files
- [ ] Language switcher in navbar toggles locale
- [ ] All UI strings externalized (no hardcoded English in components)
- [ ] Course catalog page with search + filter (track, domain, level, language)
- [ ] XP awarded on lesson completion and quiz pass
- [ ] Achievement badges earned for milestones (first lesson, track complete, streak)
- [ ] Leaderboard page (weekly + all-time)
- [ ] Discussion forums with per-lesson threads, upvoting
- [ ] Business plan builder wizard produces downloadable PDF

### Phase 6 — Cloud Labs (P2, Deferred Until Revenue)
- [ ] JupyterLite sandbox embedded in `/labs/code`
- [ ] Cloud Gazebo SITL lab accessible from course pages
- [ ] Lab booking system for HIL time slots
- [ ] Compute usage tracked per user

---

## 8. Testing Strategy

### 8.1 Playwright E2E (Required for all phases)

Every UI-facing task must have a corresponding Playwright smoke test:

**Phase 1:**
- Navigate to `/dashboard` unauthenticated → redirects to `/login`
- Login → `/dashboard` shows enrolled tracks
- Complete a lesson → progress persists after page refresh
- Logout → login again → progress still visible (server-side confirmed)

**Phase 2:**
- Navigate to `/exams` → A1/A3 and A2 exams visible
- Start A1/A3 exam → timer starts, questions render, can flag questions
- Submit exam → results page shows score, category breakdown, explanations
- Navigate to Foundation track → lessons render, free access confirmed

**Phase 3:**
- Navigate to `/pricing` → 4 tiers visible with correct prices
- Click "Subscribe" on Solo → Stripe Checkout opens (test mode)
- Unauthenticated user on paid track → paywall displayed
- Authenticated paid user on paid track → content renders

**Phase 4:**
- Enterprise admin creates org → team page accessible
- Invite team member → email sent (verify via Resend logs)
- Complete track → certificate auto-generated, PDF downloadable
- `/verify/[number]` → shows valid certificate info

**Phase 5:**
- Language switcher toggles to DE → UI strings change
- Complete lesson → XP toast shown, XP bar updates
- Post in forum → post visible, upvote works

### 8.2 Build Verification (Every Task)
```bash
npx tsc --noEmit && npm run lint && npm run build
```

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Homepage: LCP < 2.5s on 3G
- Exam engine: question transition < 100ms
- Progress API: response < 200ms at p95
- Bundle size: defer Phase 5/6 components via dynamic import

### 9.2 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for exam engine (Tab through questions, Enter to select)
- Screen reader support for progress indicators
- Color contrast ratio ≥ 4.5:1 for all text
- Focus management on route transitions

### 9.3 Security
- OWASP Top 10 compliance
- JWT tokens: HttpOnly, Secure, SameSite=Strict cookies
- RBAC middleware on all protected API routes
- Stripe webhook signature verification on all events
- Rate limiting on auth endpoints (5 attempts/min) via Upstash Redis
- Input sanitization on all user-submitted content (forum posts, profile fields)
- GDPR: data export API, account deletion API, explicit consent checkboxes
- CSP headers configured in Netlify

### 9.4 Internationalization
- Default locale: `en`
- Phase 5 locales: `de`, `fr`, `es`, `it`, `nl`
- All UI strings in `src/messages/{locale}.json`
- Content (lessons, exam questions) initially English only — translated content is a separate workstream
- URL structure: `/{locale}/path` with locale detection middleware

---

## 10. Pricing & Revenue Model

| Tier | Monthly | Annual | Includes |
|---|---|---|---|
| **Free** | €0 | €0 | Track 0 (Foundation), A1/A3 exam prep, 1 domain preview |
| **Solo** | €19 | €190/yr | All tracks, all domains, unlimited practice exams, certificates |
| **Pro** | €49 | €490/yr | Solo + cloud labs (Gazebo SITL), code sandbox (JupyterLite), priority forums |
| **Enterprise** | €199/seat | Custom | Pro + team dashboard, compliance reporting, SCORM export, SLA |

**Revenue strategy:** Free A1/A3 exam prep as acquisition funnel → Solo conversion for full curriculum → Pro upsell for hands-on labs → Enterprise for fleet training organizations.

---

## 11. External Services — Zero-Cost Launch Stack

| Service | Free Tier Limits | Paid Trigger |
|---|---|---|
| Netlify | 100GB BW, 300 build min/mo | >100GB BW/mo |
| Turso | 9GB storage, 1B row reads/mo | >9GB storage |
| Resend | 100 emails/day, 3,000/mo | >100 emails/day |
| Stripe | No monthly fee — 2.9% + €0.25/txn | N/A |
| Upstash Redis | 10K commands/day, 256MB | >10K cmd/day |
| Cloudflare R2 | 10GB storage, free egress | >10GB storage |
| YouTube | Unlimited unlisted videos | Switch to Bunny.net for analytics |
| JupyterLite | Fully client-side, zero cost | N/A |

---

## 12. Out of Scope

The following are explicitly excluded from this plan:
- Browser-based flight simulator (Three.js/WebGL) — re-evaluate post-revenue
- Mobile app (iOS/Android) — consider PWA approach first
- Video production (original filmed content) — use YouTube embeds initially
- Proctored exam integration (online proctoring) — partner with NAA-recognized entity separately
- SCORM full compliance — basic export only in Phase 4
- Custom domain per organization — defer to post-revenue
