# Autonomous Execution Ledger — DroneAI Academy v2

> Source of truth: `01_PRD_v2.md` | Guardrails: `guardrails_v2.md`
> Each task represents 1-2 file changes max. Tasks are strictly sequential within phases.
> Legacy learning-script tasks from the original PROGRESS.md run in parallel as a separate workstream.

---

## Phase 1: Foundation — Drizzle ORM, RBAC, Server-Side Progress

- [x] TASK-1.1: Install `drizzle-orm` and `drizzle-kit` (devDep). Add `drizzle.config.ts` at project root configured for Turso/libSQL. Verify `npx drizzle-kit check` runs.
- [x] TASK-1.2: Create `src/db/schema.ts` — define Drizzle table schemas for `users` (extended with role, email, full_name, avatar_url, locale, stripe_customer_id, email_verified_at, created_at), `enrollments`, and `lesson_progress`.
- [x] TASK-1.3: Create `src/db/index.ts` — instantiate Drizzle client wrapping the existing `@libsql/client` from `src/lib/db.ts`. Export typed `db` object.
- [x] TASK-1.4: Run Migration 001 — extend `users` table. Create migration SQL file in `src/db/migrations/0001_extend_users.sql`. Execute via `drizzle-kit push`.
- [x] TASK-1.5: Run Migration 002 — create `organizations` and `organization_members` tables. `src/db/migrations/0002_organizations.sql`.
- [x] TASK-1.6: Run Migration 003 — create `enrollments` and `lesson_progress` tables. `src/db/migrations/0003_enrollments_progress.sql`.
- [x] TASK-1.7: Update `src/lib/auth-context.tsx` — add `role` field to `User` interface. Update `AuthContextType` to include `role`.
- [x] TASK-1.8: Update `src/app/api/me/route.ts` — include `role` field in JWT payload and response.
- [x] TASK-1.9: Update `src/app/api/login/route.ts` — fetch `role` from DB, include in JWT token.
- [x] TASK-1.10: Update `src/app/api/register/route.ts` — set default `role='student'` and `created_at` on insert.
- [x] TASK-1.11: Create `src/middleware.ts` — RBAC middleware protecting `/dashboard` (auth required), `/enterprise/*` (enterprise_admin), `/api/progress` (auth required), `/api/organizations/*` (enterprise_admin). Pass-through for public routes.
- [x] TASK-1.12: Create `src/app/api/progress/route.ts` — GET: fetch all `lesson_progress` for authenticated user. POST: upsert lesson progress (track_id, module_id, lesson_id, status, score). PATCH: update status.
- [x] TASK-1.13: Refactor `src/lib/progress-context.tsx` — on auth: fetch progress from `/api/progress` and hydrate state. On lesson complete: POST to `/api/progress` then update local state (optimistic). When not authenticated: fall back to existing localStorage behavior.
- [x] TASK-1.14: Create `src/app/api/enrollments/route.ts` — POST: create enrollment (user_id + track_id). GET: list user enrollments with completion status.
- [x] TASK-1.15: Create `src/app/api/profile/route.ts` — PATCH: update user full_name, avatar_url, locale.
- [x] TASK-1.16: Update `src/app/profile/page.tsx` — add edit form for full_name, avatar_url, locale fields. Wire to `/api/profile`.
- [x] TASK-1.17: Create `src/components/dashboard-card.tsx` — card component showing track name, icon, progress bar, lesson count, "Continue" button.
- [x] TASK-1.18: Create `src/components/enrollment-button.tsx` — "Enroll" CTA that checks auth state; redirects to login if anonymous, calls `/api/enrollments` if authenticated.
- [x] TASK-1.19: Create `src/app/dashboard/page.tsx` — authenticated dashboard showing: enrolled tracks with progress (using `dashboard-card`), recent activity, quick-access to last visited lesson.
- [ ] TASK-1.20: Run `npx tsc --noEmit && npm run lint && npm run build` — fix any errors.
- [ ] TASK-1.21: Playwright smoke test — navigate to `/dashboard` unauthenticated (expect redirect to `/login`). Login, verify dashboard loads with track cards. Complete a lesson, refresh page, verify progress persists.

## Phase 2: EASA Content — Track 0 (Foundation) & Track 1 (Operator Certification)

### Content Generation — Track 0: Foundation (4 Modules, ~16 Lessons)
- [ ] TASK-2.1: Create `courses/foundation.json` scaffold — track metadata (id: "foundation", title, description, prerequisites). Empty modules array.
- [ ] TASK-2.2: Generate Module F.1 — "Aviation Fundamentals" (4 lessons): Airspace Classification, Weather & Meteorology, Aerodynamics for Multirotors, NOTAMs & Flight Planning. Each with overview, steps, quiz (10 Qs), learning_script (10 pages).
- [ ] TASK-2.3: Generate Module F.2 — "Drone Systems Overview" (4 lessons): Frame Types & Motors, Flight Controllers & ESCs, Batteries & Power, Payloads & Sensors. Same schema.
- [ ] TASK-2.4: Generate Module F.3 — "EASA Regulatory Framework" (4 lessons): Open Category (A1/A2/A3), Specific Category (STS/PDRA/SORA), Drone Registration & Insurance, GDPR & Privacy for Drone Operators.
- [ ] TASK-2.5: Generate Module F.4 — "Safety & Risk Management" (4 lessons): Pre-flight Checklists, Emergency Procedures, Human Factors & CRM, Environmental Considerations.

### Content Generation — Track 1: Operator Certification (6 Modules, ~24 Lessons)
- [ ] TASK-2.6: Create `courses/operator_certification.json` scaffold — track metadata (id: "operator_certification", title, description, prerequisites: ["foundation"]).
- [ ] TASK-2.7: Generate Module O.1 — "A1/A3 Exam Preparation" (5 lessons): Air Safety, Meteorology, UAS Regulations, Operating Procedures, Drone Technical Knowledge. Each with 10 quiz Qs + 10-page learning script.
- [ ] TASK-2.8: Generate Module O.2 — "A2 Theory & Practice" (5 lessons): Enhanced Meteorology, Performance & Flight Planning, Risk Mitigation, Self-Declared Practical, A2 Mock Exam Walkthrough.
- [ ] TASK-2.9: Generate Module O.3 — "STS-01: VLOS Urban Operations" (4 lessons): STS-01 Scenario Definition, Crew Resource Management, Operations Manual Essentials, STS-01 Practical Exercises.
- [ ] TASK-2.10: Generate Module O.4 — "STS-02: BVLOS Rural Operations" (4 lessons): BVLOS Principles, C2 Link Management, Contingency Planning, STS-02 Practical Exercises.
- [ ] TASK-2.11: Generate Module O.5 — "SORA Risk Assessment" (3 lessons): SORA Methodology, SAIL Level Determination, Operational Safety Objectives (OSOs).
- [ ] TASK-2.12: Generate Module O.6 — "Operations Manual Lab" (3 lessons): CONOPS Writing Workshop, Ops Manual Template Walkthrough, Compliance Checklist & Submission.

### Platform Integration — Track 0/1
- [ ] TASK-2.13: Update `src/lib/course-data.ts` — import `foundation.json` and `operator_certification.json`. Add entries to `trackMeta` with icons (Shield for Foundation, Award for Operator), colors, gradients. Add to `transformTrack` pipeline.
- [ ] TASK-2.14: Update `src/app/page.tsx` — show 6 tracks in order: Foundation (free badge), Operator, AI Engineer, MLOps, Data Engineer, Edge AI. Foundation shows "Free" label.

### Exam Engine
- [ ] TASK-2.15: Run Migration 004 — create `exam_attempts` and `exam_questions` tables. `src/db/migrations/0004_exam_engine.sql`.
- [ ] TASK-2.16: Generate `courses/exams/a1_a3_questions.json` — 200+ questions across 5 categories (meteorology, regulations, safety, drone_systems, human_factors). Each with question, 4 options, correct index, explanation, difficulty.
- [ ] TASK-2.17: Generate `courses/exams/a2_questions.json` — 200+ questions, same format, includes A2-specific topics (performance, flight planning).
- [ ] TASK-2.18: Generate `courses/exams/sts_01_questions.json` — 100+ STS-01 specific questions.
- [ ] TASK-2.19: Generate `courses/exams/sts_02_questions.json` — 100+ STS-02 specific questions.
- [ ] TASK-2.20: Create `src/app/api/exams/route.ts` — POST `/api/exams/start`: select N random questions from JSON by exam_type, create exam_attempt row, return questions (without correct answers). PATCH `/api/exams/[attemptId]/submit`: score answers, update attempt row.
- [ ] TASK-2.21: GET `/api/exams/history` — return all exam_attempts for authenticated user.
- [ ] TASK-2.22: Create `src/components/exam-timer.tsx` — countdown timer component. Displays remaining time, warns at 5 min, auto-submits at 0.
- [ ] TASK-2.23: Create `src/components/exam-question.tsx` — renders single question with radio buttons. Supports flagging. Shows question number.
- [ ] TASK-2.24: Create `src/components/exam-navigator.tsx` — grid of question number buttons. Color-coded: gray (unanswered), green (answered), orange (flagged). Click navigates to question.
- [ ] TASK-2.25: Create `src/components/exam-results-chart.tsx` — bar chart showing score per category. Uses inline SVG (no chart library dependency).
- [ ] TASK-2.26: Create `src/components/easa-badge.tsx` — small badge component displaying EASA category (A1/A3, A2, STS-01, STS-02) with icon and color.
- [ ] TASK-2.27: Create `src/app/exams/page.tsx` — exam catalog page listing available exams (A1/A3, A2, STS-01, STS-02) with descriptions, question counts, time limits, and "Start Practice" buttons.
- [ ] TASK-2.28: Create `src/app/exams/[examType]/page.tsx` — exam start page with instructions, timer info, question count. "Begin Exam" button.
- [ ] TASK-2.29: Create `src/app/exams/[examType]/attempt/page.tsx` — active exam page. Renders exam-timer, exam-question, exam-navigator. Submit button.
- [ ] TASK-2.30: Create `src/app/exams/[attemptId]/results/page.tsx` — results page. Score, pass/fail, exam-results-chart, per-question review with explanations, retry button.

### Domain-EASA Linking
- [ ] TASK-2.31: Add `prerequisite_tracks` and `easa_category` fields to all 20 domain JSON files in `courses/`. Example: agriculture.json gets `"prerequisite_tracks": ["foundation"], "easa_category": "A2"`.
- [ ] TASK-2.32: Update `src/lib/domain-data.ts` — add `prerequisite_tracks` and `easa_category` to `DomainTraining` type. Render EASA badge and prerequisite info on domain pages.
- [ ] TASK-2.33: Run `npx tsc --noEmit && npm run lint && npm run build` — fix any errors.
- [ ] TASK-2.34: Playwright smoke test — verify 6 tracks on homepage. Open Foundation track, verify lessons render. Start A1/A3 exam, answer 1 question, verify timer + navigator work. Submit exam, verify results page.

## Phase 3: Payments & Subscriptions (Stripe)

- [ ] TASK-3.1: Install `stripe` and `@stripe/stripe-js`. Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` to `.env.local`.
- [ ] TASK-3.2: Run Migration 005 — create `subscriptions` and `purchases` tables. `src/db/migrations/0005_payments.sql`.
- [ ] TASK-3.3: Create `src/lib/stripe.ts` — Stripe server client initialization. Helper functions: `createCheckoutSession()`, `getSubscriptionStatus()`, `getCustomerPortalUrl()`.
- [ ] TASK-3.4: Create `src/app/api/checkout/route.ts` — POST: create Stripe Checkout session for selected plan. Maps plan names to Stripe price IDs.
- [ ] TASK-3.5: Create `src/app/api/webhooks/stripe/route.ts` — handle `checkout.session.completed` (create subscription row), `customer.subscription.updated` (update status), `customer.subscription.deleted` (mark canceled), `invoice.paid` (extend period).
- [ ] TASK-3.6: Create `src/lib/access-control.ts` — define content gating rules: Foundation track + A1/A3 exam = free. All other tracks, domains, exams = Solo+. Labs = Pro+. Enterprise features = Enterprise only.
- [ ] TASK-3.7: Update `src/middleware.ts` — extend RBAC to check subscription status for paid content routes. Redirect free users to `/pricing` with return URL.
- [ ] TASK-3.8: Create `src/components/pricing-card.tsx` — card component for each subscription tier. Highlights recommended plan. Shows feature list.
- [ ] TASK-3.9: Create `src/components/paywall.tsx` — content gate overlay shown to free users on paid content. "Upgrade to Solo" CTA with pricing info.
- [ ] TASK-3.10: Create `src/components/subscription-status.tsx` — small badge/pill showing current plan in navbar or dashboard.
- [ ] TASK-3.11: Create `src/app/pricing/page.tsx` — pricing page with 4 tier cards (Free, Solo, Pro, Enterprise). FAQ section. Annual/monthly toggle.
- [ ] TASK-3.12: Create `src/app/settings/billing/page.tsx` — billing management page. Shows current plan, next billing date, opens Stripe Customer Portal for changes.
- [ ] TASK-3.13: Run `npx tsc --noEmit && npm run lint && npm run build` — fix any errors.
- [ ] TASK-3.14: Playwright smoke test — navigate to `/pricing`, verify all 4 tiers render. Click Solo subscribe (test mode), verify Stripe Checkout opens. Navigate to paid track as free user, verify paywall shown.

## Phase 4: Enterprise Features & Certificates

- [ ] TASK-4.1: Run Migration 006 — create `user_achievements` and `user_xp_log` tables. `src/db/migrations/0006_gamification.sql`.
- [ ] TASK-4.2: Run Migration 007 — create `forum_posts` table. `src/db/migrations/0007_forum.sql`.
- [ ] TASK-4.3: Run Migration 008 — create `certificates` table. `src/db/migrations/0008_certificates.sql`.
- [ ] TASK-4.4: Create `src/app/api/organizations/route.ts` — POST: create organization (name, slug). GET: list user's organizations.
- [ ] TASK-4.5: Create `src/app/api/organizations/[orgId]/members/route.ts` — GET: list members with progress. POST: invite member by email.
- [ ] TASK-4.6: Create `src/app/api/organizations/[orgId]/invite/route.ts` — invitation accept flow. Verify token, add user to org_members.
- [ ] TASK-4.7: Create `src/app/enterprise/page.tsx` — enterprise dashboard. Team progress overview, quick stats (enrolled, completed, compliance %).
- [ ] TASK-4.8: Create `src/app/enterprise/team/page.tsx` — team management page. Member list with roles, invite button, remove member.
- [ ] TASK-4.9: Create `src/app/enterprise/invite/page.tsx` — invitation email entry form. Sends via Resend.
- [ ] TASK-4.10: Create `src/app/enterprise/compliance/page.tsx` — compliance matrix (members × required tracks). Color-coded cells.
- [ ] TASK-4.11: Create `src/components/certificate-card.tsx` — certificate display card with download button and verification link.
- [ ] TASK-4.12: Create `src/components/team-member-row.tsx` — row component for member list (avatar, name, role, progress bar, actions).
- [ ] TASK-4.13: Create `src/components/compliance-cell.tsx` — status cell for compliance matrix (complete/in-progress/not-started with icons).
- [ ] TASK-4.14: Install `@react-pdf/renderer`. Create `src/lib/certificate-generator.ts` — PDF template: DroneAI Academy seal, holder name, track name, completion date, unique certificate number, QR code link to verification page.
- [ ] TASK-4.15: Create `src/app/api/certificates/route.ts` — POST: generate certificate (verifies all lessons completed), assigns unique number, generates PDF, uploads to R2, stores record. GET: list user certificates.
- [ ] TASK-4.16: Create `src/app/verify/[certificateNumber]/page.tsx` — public verification page. Displays certificate validity, holder name (partial), track, date.
- [ ] TASK-4.17: Create `src/app/api/enterprise/export/route.ts` — GET: export team progress as CSV. Parameters: org_id, format (csv/json).
- [ ] TASK-4.18: Run `npx tsc --noEmit && npm run lint && npm run build` — fix any errors.
- [ ] TASK-4.19: Playwright smoke test — create org, invite member (mock). Verify enterprise dashboard loads. Complete track, verify certificate generated, verify `/verify/[number]` page.

## Phase 5: i18n, Gamification, Community & Business Tools

### Internationalization
- [ ] TASK-5.1: Install `next-intl`. Create `src/i18n/request.ts` for server-side i18n config. Create `src/i18n/routing.ts` for locale routing.
- [ ] TASK-5.2: Create `src/messages/en.json` — extract all hardcoded English UI strings from existing components and pages into structured message keys.
- [ ] TASK-5.3: Create `src/messages/de.json` — German translation of all UI strings.
- [ ] TASK-5.4: Update `src/middleware.ts` — add locale detection and routing (accept-language header, cookie preference, URL prefix).
- [ ] TASK-5.5: Create `src/components/language-switcher.tsx` — dropdown in navbar to switch locale.
- [ ] TASK-5.6: Refactor `src/components/navbar.tsx` — integrate language-switcher, use `useTranslations()` for all navbar strings.
- [ ] TASK-5.7: Refactor `src/app/page.tsx` — replace hardcoded strings with `useTranslations()` calls.

### Gamification
- [ ] TASK-5.8: Create `src/lib/gamification.ts` — XP rules: lesson_complete=50xp, quiz_pass=25xp, exam_pass=100xp, streak_day=10xp. Achievement definitions: first_lesson, track_complete, streak_7, streak_30, exam_ace.
- [ ] TASK-5.9: Create `src/app/api/xp/route.ts` — POST: award XP (validates source, inserts xp_log row, checks achievements). GET: user XP total and level.
- [ ] TASK-5.10: Create `src/components/xp-bar.tsx` — XP progress bar showing current XP, level, XP to next level.
- [ ] TASK-5.11: Create `src/components/achievement-badge.tsx` — badge component with icon, title, tooltip description.
- [ ] TASK-5.12: Create `src/components/streak-counter.tsx` — flame icon with streak count, warns if streak about to break.
- [ ] TASK-5.13: Create `src/app/leaderboard/page.tsx` — leaderboard page with weekly and all-time tabs. Shows top users by XP.

### Community & Forums
- [ ] TASK-5.14: Create `src/app/api/forums/route.ts` — GET: list posts (filterable by track/lesson). POST: create post/reply.
- [ ] TASK-5.15: Create `src/app/api/forums/[postId]/route.ts` — PATCH: upvote. DELETE: remove (author or admin).
- [ ] TASK-5.16: Create `src/components/forum-post.tsx` — post card with author, timestamp, body, upvote button, reply count.
- [ ] TASK-5.17: Create `src/app/forums/page.tsx` — forum index. Recent posts, filter by track.
- [ ] TASK-5.18: Create `src/app/forums/[trackId]/[lessonId]/page.tsx` — per-lesson discussion thread.

### Business Tools & Catalog
- [ ] TASK-5.19: Create `src/app/catalog/page.tsx` — course catalog with search bar, filters (track/domain/level/language/free-vs-paid).
- [ ] TASK-5.20: Create `src/app/portfolio/[userId]/page.tsx` — public student portfolio: completed tracks, certificates, badges, XP level.
- [ ] TASK-5.21: Create `src/app/tools/business-plan/page.tsx` — guided wizard: select domain → answer prompts → generate drone business plan PDF.
- [ ] TASK-5.22: Create `src/app/tools/equipment/page.tsx` — equipment recommender: filter by domain + budget → recommended drone/sensor/software stack.
- [ ] TASK-5.23: Create `src/components/notification-bell.tsx` — notification dropdown in navbar. Shows unread count, recent notifications.
- [ ] TASK-5.24: Create `src/app/api/notifications/route.ts` — GET: user notifications. PATCH: mark read.
- [ ] TASK-5.25: Create `src/lib/streaks.ts` — streak calculation logic. Daily streak counter, study streak, streak-at-risk detection.
- [ ] TASK-5.26: Run `npx tsc --noEmit && npm run lint && npm run build` — fix any errors.
- [ ] TASK-5.27: Playwright smoke test — toggle language to DE, verify UI strings change. Complete lesson, verify XP toast. Post in forum, verify post appears. Visit `/catalog`, verify filters work.

## Phase 6: Cloud Lab Infrastructure (Deferred Until Revenue)

- [ ] TASK-6.1: Create `infra/gazebo/Dockerfile` — PX4-SITL + Gazebo environment with noVNC web access.
- [ ] TASK-6.2: Create `infra/gazebo/docker-compose.yml` — configure Gazebo lab container with resource limits, noVNC port mapping.
- [ ] TASK-6.3: Create `src/app/api/labs/route.ts` — POST: create lab session (spin up container). GET: list active sessions. DELETE: terminate session.
- [ ] TASK-6.4: Create `src/app/labs/page.tsx` — lab catalog showing available lab environments: Gazebo SITL, JupyterLite, HIL (if available).
- [ ] TASK-6.5: Create `src/app/labs/code/page.tsx` — embed JupyterLite (loaded via CDN) with pre-configured ROS2/PX4 exercise notebooks.
- [ ] TASK-6.6: Create `src/app/labs/book/page.tsx` — booking calendar for HIL lab time slots. Integrates with lab session API.
- [ ] TASK-6.7: Create `src/components/lab-session.tsx` — embedded iframe component for active lab sessions with status bar and terminate button.
- [ ] TASK-6.8: Run `npx tsc --noEmit && npm run lint && npm run build` — fix any errors.
- [ ] TASK-6.9: Playwright smoke test — navigate to `/labs`, verify catalog loads. Open JupyterLite sandbox, verify it renders in iframe.

## Phase 7: Final Validation & Build Verification

- [ ] TASK-7.1: Run complete `npx tsc --noEmit` — resolve all TypeScript errors across the entire codebase.
- [ ] TASK-7.2: Run `npm run lint` — resolve all ESLint warnings and errors.
- [ ] TASK-7.3: Run `npm run build` — ensure production build succeeds.
- [ ] TASK-7.4: Playwright full regression — navigate every new page (dashboard, exams, pricing, enterprise, catalog, forums, labs). Verify render without errors.
- [ ] TASK-7.5: Verify all original functionality intact — 4 existing tracks, 20 domains, glossary, hardware, profile, login/register.
