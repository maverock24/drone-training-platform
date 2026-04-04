# Product Requirements Document: 10-Page Learning Scripts for Every Lesson

## Executive Summary

Add a comprehensive **10-page learning script** to each of the 25 lessons in the drone training platform. Each script serves as a self-contained educational resource that:

1. Covers all fundamental concepts for the lesson topic in depth
2. Provides detailed explanations for every quiz question — including **why each correct answer is right** and **why each incorrect option is wrong**
3. Is accessible through a new **"Script"** tab in the lesson UI (5th tab alongside Learn, Practice, Quiz, Notes)
4. Is stored as a `learning_script` field directly in `drone_training.json`

**Total content scope:** 25 lessons × 10 pages = **250 pages** of deep educational content generated via LLM during the Ralph Orchestrator loop.

---

## System Architecture

### Tech Stack (Existing — No Changes)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.1 |
| Runtime | React | 19.2.4 |
| Styling | Tailwind CSS v4 | via `@tailwindcss/postcss` |
| Components | shadcn/ui | v4.1.1 |
| Icons | lucide-react | 1.7.0 |
| Language | TypeScript | strict mode |

### Data Source

- **File:** `courses/drone_training.json`
- **Modification:** Add a `learning_script` array to each lesson object
- **No new dependencies required**

---

## Data Model

### New Type: `LearningScriptPage`

```typescript
export interface LearningScriptPage {
  page: number;          // 1-10
  title: string;         // Page heading (e.g., "Understanding Vision Transformers")
  content: string;       // Full educational content in plain text with markdown-like formatting
  key_takeaways: string[]; // 2-4 bullet-point summaries of the page
}
```

### Modified Type: `Lesson`

```typescript
export interface Lesson {
  id: string;
  title: string;
  detailed_explanation: string;
  step_by_step_guide: Step[];
  quiz: QuizQuestion[];
  learning_script?: LearningScriptPage[];  // NEW — optional for backward compat
}
```

### JSON Structure per Lesson (Added Field)

```json
{
  "title": "Architectural Mastery: Vision Transformers & Multi-Modal Models",
  "detailed_explanation": "...",
  "step_by_step_guide": [...],
  "quiz": [...],
  "learning_script": [
    {
      "page": 1,
      "title": "Introduction: Why Vision Transformers Matter for Drones",
      "content": "... 800-1200 words of educational content ...",
      "key_takeaways": [
        "ViTs process images as sequences of patches, unlike CNNs",
        "Self-attention enables global context understanding",
        "Critical for aerial perception where objects appear at varying scales"
      ]
    },
    {
      "page": 2,
      "title": "Patch Embedding and Positional Encoding Deep Dive",
      "content": "...",
      "key_takeaways": [...]
    }
  ]
}
```

### Page Content Structure (Per Page Template)

Each of the 10 pages per lesson must follow this structure:

| Page | Purpose | Content Guidelines |
|---|---|---|
| **Page 1** | Introduction & Motivation | Why this topic matters for drone engineering. Real-world applications. Prerequisites recap. |
| **Page 2** | Core Concept #1 | Deep dive into the first fundamental concept. Analogies, definitions, diagrams described in text. |
| **Page 3** | Core Concept #2 | Second major concept. Build on Page 2. Show relationships between concepts. |
| **Page 4** | Core Concept #3 | Third concept or deeper technical detail. Mathematical foundations if applicable. |
| **Page 5** | Practical Application | How these concepts translate to actual drone systems. Code patterns explained (not raw code). |
| **Page 6** | Common Pitfalls & Edge Cases | What can go wrong. Mistakes beginners make. Debugging approaches. |
| **Page 7** | Advanced Considerations | Performance implications, scaling, hardware constraints, optimization strategies. |
| **Page 8** | Quiz Deep Dive — Part 1 | Cover approximately the first half of quiz questions. For each: explain the correct answer thoroughly, then explain why each wrong option is incorrect. |
| **Page 9** | Quiz Deep Dive — Part 2 | Cover the remaining quiz questions with the same depth. |
| **Page 10** | Summary & Self-Assessment | Comprehensive recap. Connections to other lessons. What to study next. Self-check questions. |

### Content Quality Requirements

- **Word count per page:** 800–1,200 words (aim for ~1,000)
- **Total per lesson:** 8,000–12,000 words
- **Tone:** Technical but accessible. Write as an expert instructor teaching a motivated student.
- **Quiz explanations:** For EVERY quiz question in the lesson, explain:
  - Why the correct answer is right (with supporting detail)
  - Why each incorrect option is wrong (not just "this is wrong" — explain the misconception)
- **No code blocks in the script.** Refer to code concepts by name and explain what they do in prose.
- **Use the lesson's `detailed_explanation`, `step_by_step_guide`, and `quiz` data as source material** — the script should cover everything those fields mention and more.

---

## Component Hierarchy

### New Components

```
src/components/
  learning-script-viewer.tsx    # Main paginated viewer component
```

### Modified Files

```
src/lib/course-data.ts          # Add LearningScriptPage interface, update Lesson type
src/app/tracks/[trackId]/[moduleId]/[lessonId]/page.tsx  # Add 5th "Script" tab
```

### `LearningScriptViewer` Component Specification

**Props:**
```typescript
interface LearningScriptViewerProps {
  pages: LearningScriptPage[];
  lessonKey: string;  // For tracking read progress
}
```

**Behavior:**
- Displays one page at a time
- Page navigation: Previous / Next buttons + page number indicator (e.g., "Page 3 of 10")
- Page selector: clickable page numbers or dots for direct navigation
- Current page number persisted in component state (resets when lesson changes)
- Each page renders:
  - Page number badge
  - Page title as heading
  - Content paragraphs (split on `\n\n`, render with `<GlossaryText>` for term highlighting)
  - Key takeaways in a styled callout card at the bottom
- If `learning_script` is undefined/empty on a lesson, the Script tab should show a "Coming soon" placeholder

**Visual Design:**
- Match existing card/container patterns from the Learn tab
- Use the track's gradient color for the page number badge
- Key takeaways card: use `bg-primary/5 border-primary/20` styling
- Smooth transition between pages (simple opacity fade or none — no heavy animation)
- Responsive: readable on mobile (single column, full width)

### Tab Integration

The lesson page currently has 4 tabs: Learn, Practice, Quiz, Notes.

Add a 5th tab **"Script"** between Learn and Practice:

```
Learn | Script | Practice | Quiz | Notes
```

- Tab icon: `FileText` from lucide-react
- Tab value: `"script"`
- When lesson has no `learning_script` data, the tab still appears but shows placeholder content
- Grid changes from `grid-cols-4` to `grid-cols-5`

---

## API Contracts

No API changes required. All data is statically imported from `drone_training.json`.

---

## Acceptance Criteria

### AC-1: Data Schema
- [ ] `LearningScriptPage` interface exists in `course-data.ts`
- [ ] `Lesson` interface includes optional `learning_script?: LearningScriptPage[]`
- [ ] `drone_training.json` contains a `learning_script` array with exactly 10 pages for all 25 lessons

### AC-2: Content Quality
- [ ] Every page has 800–1,200 words of content
- [ ] Pages 8 and 9 of each script cover ALL quiz questions for that lesson
- [ ] For lessons with 20 quiz questions: each question gets an individual explanation
- [ ] For lessons with 1 quiz question: Pages 8–9 provide extra depth on related concepts
- [ ] Each page has 2–4 key takeaways

### AC-3: UI — Script Tab
- [ ] 5th "Script" tab appears in the lesson page tab bar
- [ ] Tab is always visible (even when learning_script data is missing)
- [ ] TabsList grid changes from 4 to 5 columns

### AC-4: UI — Page Viewer
- [ ] `LearningScriptViewer` component renders one page at a time
- [ ] Previous/Next navigation buttons work correctly
- [ ] Page 1 disables the Previous button, Page 10 disables the Next button
- [ ] Page number indicator shows current position
- [ ] Content renders with paragraph breaks and glossary term highlighting
- [ ] Key takeaways block renders at the bottom of each page
- [ ] Empty/missing data state renders a "Coming soon" placeholder

### AC-5: Build & Lint
- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` passes
- [ ] TypeScript strict mode produces no errors

### AC-6: Playwright Smoke Test
- [ ] Navigate to a lesson page, the Script tab is visible and clickable
- [ ] Clicking Script tab shows Page 1 content
- [ ] Next button navigates to Page 2
- [ ] Page indicator updates correctly
- [ ] Content text is visible and non-empty

---

## Testing Strategy

### Playwright E2E Tests

1. **Script Tab Visibility:** Navigate to any lesson → verify the "Script" tab exists in the tab bar
2. **Script Content Rendering:** Click the Script tab → verify page title and content text are visible
3. **Page Navigation:** Click Next → verify page 2 title appears. Click Previous → verify page 1 returns.
4. **Boundary Navigation:** On page 1 → Previous button is disabled. Navigate to page 10 → Next button is disabled.
5. **Empty State:** If any lesson lacks script data, the tab shows placeholder text.

### Static Validation

- TypeScript compilation: all 25 lessons satisfy the `LearningScriptPage[]` schema
- JSON structural validation: every `learning_script` array has exactly 10 elements, each with `page`, `title`, `content`, `key_takeaways`

---

## Non-Functional Requirements

### Performance
- The `drone_training.json` file will grow significantly (~250–300KB of additional text content). Since it's statically imported at build time via Next.js, this has **zero runtime performance impact** — it's bundled into the page chunk.
- Only the current lesson's script data is rendered, so DOM size is bounded.

### Accessibility
- Page navigation buttons must have `aria-label` attributes
- Page content must use semantic headings
- Key takeaways should use `<ul>` list markup

### Security
- No new attack surface. All content is static JSON. No user input is involved in script rendering.

---

## Lesson Inventory (25 Lessons Requiring Scripts)

### Track 1: AI Engineer (8 lessons)
1. Architectural Mastery: Vision Transformers & Multi-Modal Models (20 quiz questions)
2. Parameter-Efficient Fine-Tuning (PEFT) (20 quiz questions)
3. Production Optimization Stack: Quantization & Distillation (20 quiz questions)
4. Sparsity & Pruning (20 quiz questions)
5. Adversarial Robustness: Hardening the Drone's Perception (1 quiz question)
6. Few-Shot Object Detection with Prototypical Networks (1 quiz question)
7. Adversarial Robustness: Hardening the Drone's Perception (1 quiz question) — duplicate
8. Few-Shot Object Detection with Prototypical Networks (1 quiz question) — duplicate

### Track 2: MLOps Engineer (6 lessons)
9. Infrastructure as Code (IaC) for AI (20 quiz questions)
10. Workflow Orchestration & Data Versioning (20 quiz questions)
11. Model Serving & Observability (20 quiz questions)
12. CI/CD for Machine Learning Models (20 quiz questions)
13. Chaos Engineering: Injecting Failure into GPU Workloads (1 quiz question)
14. Chaos Engineering: Injecting Failure into GPU Workloads (1 quiz question) — duplicate

### Track 3: Data Engineer (5 lessons)
15. Geospatial Intelligence (GeoAI) (20 quiz questions)
16. Sensor Fusion Pipelines (20 quiz questions)
17. Labeling & QA with Active Learning (20 quiz questions)
18. Spatiotemporal Object Tracking with DeepSORT (1 quiz question)
19. Spatiotemporal Object Tracking with DeepSORT (1 quiz question) — duplicate

### Track 4: Edge AI Engineer (6 lessons)
20. On-Device Hardware Acceleration (20 quiz questions)
21. Robotics Middleware: ROS 2 & MAVROS (20 quiz questions)
22. Optimization for Survival: HIL & Latency Profiling (20 quiz questions)
23. TensorRT Optimization & Deployment Pipeline (20 quiz questions)
24. Bare-Metal Kernel Optimization for Real-Time Execution (1 quiz question)
25. Bare-Metal Kernel Optimization for Real-Time Execution (1 quiz question) — duplicate

> **Note for Orchestrator:** Lessons 5–8, 13–14, 18–19, and 24–25 are duplicated entries in the JSON. The scripts for duplicate lessons should still be generated — they exist as separate lesson objects and each needs its own `learning_script` field populated.
