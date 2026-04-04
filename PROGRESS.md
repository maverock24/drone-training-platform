# Autonomous Execution Ledger

## Phase 1: Foundation — Schema & Component Scaffolding

- [x] TASK-1.1: Add `LearningScriptPage` interface and update `Lesson` type in `src/lib/course-data.ts` to include the optional `learning_script` field.
- [x] TASK-1.2: Create the `src/components/learning-script-viewer.tsx` component with page navigation, content rendering, key takeaways card, and empty-state placeholder.
- [x] TASK-1.3: Integrate the Script tab into `src/app/tracks/[trackId]/[moduleId]/[lessonId]/page.tsx` — add 5th tab, update grid to 5 columns, wire up `LearningScriptViewer`.

## Phase 2: Content Generation — AI Engineer Track (8 Lessons)

- [x] TASK-2.1: Generate 10-page learning script for AI Engineer Lesson 1 — "Architectural Mastery: Vision Transformers & Multi-Modal Models" (20 quiz Qs). Add to `drone_training.json` tracks[0].lessons[0].learning_script.
- [x] TASK-2.2: Generate 10-page learning script for AI Engineer Lesson 2 — "Parameter-Efficient Fine-Tuning (PEFT)" (20 quiz Qs). Add to tracks[0].lessons[1].learning_script.
- [x] TASK-2.3: Generate 10-page learning script for AI Engineer Lesson 3 — "Production Optimization Stack: Quantization & Distillation" (20 quiz Qs). Add to tracks[0].lessons[2].learning_script.
- [ ] TASK-2.4: Generate 10-page learning script for AI Engineer Lesson 4 — "Sparsity & Pruning" (20 quiz Qs). Add to tracks[0].lessons[3].learning_script.
- [ ] TASK-2.5: Generate 10-page learning script for AI Engineer Lesson 5 — "Adversarial Robustness: Hardening the Drone's Perception" (1 quiz Q). Add to tracks[0].lessons[4].learning_script.
- [ ] TASK-2.6: Generate 10-page learning script for AI Engineer Lesson 6 — "Few-Shot Object Detection with Prototypical Networks" (1 quiz Q). Add to tracks[0].lessons[5].learning_script.
- [ ] TASK-2.7: Generate 10-page learning script for AI Engineer Lesson 7 — duplicate of Lesson 5. Generate a fresh script variant for tracks[0].lessons[6].learning_script.
- [ ] TASK-2.8: Generate 10-page learning script for AI Engineer Lesson 8 — duplicate of Lesson 6. Generate a fresh script variant for tracks[0].lessons[7].learning_script.

## Phase 3: Content Generation — MLOps Engineer Track (6 Lessons)

- [ ] TASK-3.1: Generate 10-page learning script for MLOps Lesson 1 — "Infrastructure as Code (IaC) for AI" (20 quiz Qs). Add to tracks[1].lessons[0].learning_script.
- [ ] TASK-3.2: Generate 10-page learning script for MLOps Lesson 2 — "Workflow Orchestration & Data Versioning" (20 quiz Qs). Add to tracks[1].lessons[1].learning_script.
- [ ] TASK-3.3: Generate 10-page learning script for MLOps Lesson 3 — "Model Serving & Observability" (20 quiz Qs). Add to tracks[1].lessons[2].learning_script.
- [ ] TASK-3.4: Generate 10-page learning script for MLOps Lesson 4 — "CI/CD for Machine Learning Models" (20 quiz Qs). Add to tracks[1].lessons[3].learning_script.
- [ ] TASK-3.5: Generate 10-page learning script for MLOps Lesson 5 — "Chaos Engineering: Injecting Failure into GPU Workloads" (1 quiz Q). Add to tracks[1].lessons[4].learning_script.
- [ ] TASK-3.6: Generate 10-page learning script for MLOps Lesson 6 — duplicate of Lesson 5. Generate fresh variant for tracks[1].lessons[5].learning_script.

## Phase 4: Content Generation — Data Engineer Track (5 Lessons)

- [ ] TASK-4.1: Generate 10-page learning script for Data Engineer Lesson 1 — "Geospatial Intelligence (GeoAI)" (20 quiz Qs). Add to tracks[2].lessons[0].learning_script.
- [ ] TASK-4.2: Generate 10-page learning script for Data Engineer Lesson 2 — "Sensor Fusion Pipelines" (20 quiz Qs). Add to tracks[2].lessons[1].learning_script.
- [ ] TASK-4.3: Generate 10-page learning script for Data Engineer Lesson 3 — "Labeling & QA with Active Learning" (20 quiz Qs). Add to tracks[2].lessons[2].learning_script.
- [ ] TASK-4.4: Generate 10-page learning script for Data Engineer Lesson 4 — "Spatiotemporal Object Tracking with DeepSORT" (1 quiz Q). Add to tracks[2].lessons[3].learning_script.
- [ ] TASK-4.5: Generate 10-page learning script for Data Engineer Lesson 5 — duplicate of Lesson 4. Generate fresh variant for tracks[2].lessons[4].learning_script.

## Phase 5: Content Generation — Edge AI Engineer Track (6 Lessons)

- [ ] TASK-5.1: Generate 10-page learning script for Edge AI Lesson 1 — "On-Device Hardware Acceleration" (20 quiz Qs). Add to tracks[3].lessons[0].learning_script.
- [ ] TASK-5.2: Generate 10-page learning script for Edge AI Lesson 2 — "Robotics Middleware: ROS 2 & MAVROS" (20 quiz Qs). Add to tracks[3].lessons[1].learning_script.
- [ ] TASK-5.3: Generate 10-page learning script for Edge AI Lesson 3 — "Optimization for Survival: HIL & Latency Profiling" (20 quiz Qs). Add to tracks[3].lessons[2].learning_script.
- [ ] TASK-5.4: Generate 10-page learning script for Edge AI Lesson 4 — "TensorRT Optimization & Deployment Pipeline" (20 quiz Qs). Add to tracks[3].lessons[3].learning_script.
- [ ] TASK-5.5: Generate 10-page learning script for Edge AI Lesson 5 — "Bare-Metal Kernel Optimization for Real-Time Execution" (1 quiz Q). Add to tracks[3].lessons[4].learning_script.
- [ ] TASK-5.6: Generate 10-page learning script for Edge AI Lesson 6 — duplicate of Lesson 5. Generate fresh variant for tracks[3].lessons[5].learning_script.

## Phase 6: Validation & Build Verification

- [ ] TASK-6.1: Run `npx tsc --noEmit` — fix any TypeScript errors related to the new `learning_script` field or component.
- [ ] TASK-6.2: Run `npm run lint` — fix all linting errors.
- [ ] TASK-6.3: Run `npm run build` — ensure production build succeeds with the significantly larger JSON payload.

## Phase 7: Autonomous Quality Assurance — Playwright E2E

- [ ] TASK-7.1: Start dev server. Use Playwright MCP to navigate to an AI Engineer lesson. Verify the Script tab is visible and clickable.
- [ ] TASK-7.2: Click the Script tab. Verify Page 1 title and content are visible and non-empty. Verify key takeaways card renders.
- [ ] TASK-7.3: Click the Next button. Verify Page 2 loads. Click Previous. Verify Page 1 returns. Verify page indicator updates.
- [ ] TASK-7.4: Navigate to Page 10. Verify the Next button is disabled. Navigate to Page 1. Verify Previous button is disabled.
- [ ] TASK-7.5: Navigate to a lesson from each of the other 3 tracks (MLOps, Data Engineer, Edge AI). Verify Script tab renders content for each.
