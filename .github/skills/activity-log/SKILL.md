---
name: activity-log
description: Standardized activity log formatting for research agents. ISO 8601 timestamps, agent names, and action codes.
user-invocable: false
---

# Activity Log Skill

Use this skill when appending entries to `research_activity.log` during research execution. All agents must follow this format for consistency and machine-readability.

## Format

Every log entry follows this pattern:

```
[YYYY-MM-DDTHH:MM:SSZ] AGENT: ACTION — Detail.
```

Where:
- **Timestamp** is ISO 8601 UTC (use `date -u +%Y-%m-%dT%H:%M:%SZ`)
- **AGENT** is one of: `PLANNER`, `WORKER`, `REVIEWER`, `COORDINATOR`
- **ACTION** is one of: `INIT`, `TASK_START`, `TASK_COMPLETE`, `TASK_FAIL`, `REVIEW`, `SATURATED`, `REFLECT`, `COMPLETE`
- **Detail** is a single sentence describing what happened

## Action Codes

| Code | Meaning |
|---|---|
| `INIT` | Agent started, ledger loaded |
| `TASK_START` | Began working on a specific task |
| `TASK_COMPLETE` | Task finished successfully |
| `TASK_FAIL` | Task failed after retries |
| `REVIEW` | Reviewer verdict issued |
| `SATURATED` | Search stopped due to diminishing novelty |
| `REFLECT` | Post-task reflection written |
| `COMPLETE` | All tasks finished, research concluded |

## Examples

```
[2026-04-08T14:30:00Z] PLANNER: INIT — Generated 12 tasks for "Helsinki tour app" research.
[2026-04-08T14:31:00Z] WORKER: TASK_START — TASK-1.1: Helsinki POI data sources.
[2026-04-08T14:35:00Z] WORKER: SATURATED — TASK-1.1: 8 sources, last 3 <10% novelty.
[2026-04-08T14:36:00Z] WORKER: TASK_COMPLETE — TASK-1.1: 7 sources evaluated, 4 recommended.
[2026-04-08T14:37:00Z] WORKER: REFLECT — TASK-1.1: site-specific queries outperformed broad.
[2026-04-08T15:00:00Z] REVIEWER: REVIEW — PASS (8/10), 2 uncited claims flagged.
[2026-04-08T15:01:00Z] COORDINATOR: COMPLETE — Research finished, 29 sources, 12 sections.
```

## Rules

- Always use terminal append (`echo "..." >> research_activity.log`) to avoid diff timeouts on growing files.
- One entry per line. No multi-line entries.
- Do not log routine file reads or searches — only state transitions.
