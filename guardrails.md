# Guardrails — Learning Script Feature

## Coding Standards

### TypeScript
- Strict mode enabled — no `any` types, no `@ts-ignore`
- All new interfaces go in `src/lib/course-data.ts`
- Use `interface` for data shapes, not `type` aliases
- Optional fields use `?` suffix, never `| undefined`

### React / Next.js
- Components are `"use client"` only when they need hooks or interactivity
- Use named exports for components, not default exports (except page.tsx files)
- Props interfaces are defined inline or co-located in the same file
- Follow existing import order: React → Next → shadcn/ui → lucide → local

### Tailwind CSS
- Use existing design tokens and patterns from shadcn/ui components
- Dark mode via CSS variables (already configured) — no `dark:` prefix utilities
- Responsive: mobile-first, use `sm:` and `md:` breakpoints matching existing patterns
- Match existing card/border patterns: `border-border/50`, `bg-muted/20`, `text-muted-foreground`

### JSON Content
- All strings in `drone_training.json` must be valid JSON — escape special characters properly
- No trailing commas
- `learning_script` array must have exactly 10 elements per lesson, no more, no less
- Page numbers must be sequential 1–10
- `key_takeaways` arrays must have 2–4 items
- Content paragraphs separated by `\n\n` (double newline) within the content string

## Forbidden Patterns

- **DO NOT** use `dangerouslySetInnerHTML` for rendering script content
- **DO NOT** add any new npm dependencies for this feature
- **DO NOT** modify the structure of existing lesson fields (`detailed_explanation`, `step_by_step_guide`, `quiz`)
- **DO NOT** change the existing 4-tab behavior — only ADD the 5th tab
- **DO NOT** use `localStorage` for page position tracking (keep it in React state only)
- **DO NOT** split `drone_training.json` into multiple files
- **DO NOT** add loading spinners or skeleton states — the data is static and instantly available
- **DO NOT** use `eval()`, template literals with user input, or any dynamic code execution
- **DO NOT** modify any domain-specific course files (agriculture.json, fire.json, etc.)
- **DO NOT** generate placeholder or lorem ipsum content — every page must contain real, accurate educational content

## Architecture Boundaries

| From | Can Import | Cannot Import |
|---|---|---|
| `learning-script-viewer.tsx` | shadcn/ui components, lucide icons, `GlossaryText` | `course-data.ts` directly (data passed via props) |
| `page.tsx` (lesson) | `learning-script-viewer.tsx`, `course-data.ts` | No new data files |
| `course-data.ts` | `drone_training.json` | No React components |
| `drone_training.json` | N/A (data file) | N/A |

## Content Generation Rules

When generating learning script content for each lesson:

1. **Read the lesson's existing data first** — `detailed_explanation`, all `step_by_step_guide` entries, and all `quiz` questions with answers
2. **Pages 1–7 must cover all concepts** mentioned in the detailed explanation and step-by-step guide
3. **Pages 8–9 must cover every single quiz question** — for lessons with 20 questions, allocate ~10 per page; for lessons with 1 question, use pages 8–9 for extended topic discussion
4. **For each quiz question explain:** the correct answer with supporting detail, AND why each wrong option is incorrect (identify the specific misconception)
5. **Page 10 must summarize** the entire lesson and connect it to the broader track context
6. **No fabricated citations** — do not invent paper names, author names, or URLs
7. **Technical accuracy** — concepts must be correct for the domain (ML, MLOps, data engineering, edge AI)
8. **Consistent voice** — write as an expert instructor, not as an AI assistant

## Lessons Learned

<!-- This section will be populated by the Ralph Orchestrator as it encounters issues -->

