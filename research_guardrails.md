# Research Guardrails

## Source Quality Standards
- Prioritize Tier 1 industry analysts (DroneII, ABI, Gartner) and Tier 1 aviation authorities (EASA).
- For the technical stack (ROS2, PX4, Jetson), prefer standard documentation, officially endorsed tutorials, or highly-starred OSS frameworks over generic blogs.
- Ignore consumer RC drone blogs. Focus on commercial/industrial operational resources.

## Forbidden Sources
- General interest tech blogs with no verified authority on aviation law.
- FAA/Part 107 documentation (Unless strictly for comparative analysis, the baseline MUST be EASA).
- Non-authoritative forum speculation regarding drone law.

## Citation Format
- Inline URL or direct Markdown links to the primary document/report.
- Include publication year for all EASA regulations referenced.

## Hallucination Prevention Rules
- Never fabricate EASA regulatory tiers or license classifications (e.g., A1/A2/A3, STS, LUC).
- Never invent competitor features. If a competitor's syllabus is hidden, mark it as `[PAYWALLED/HIDDEN]`.
- Never attribute a claim to an industry report without reading the abstract/press release.

## Token Budget Guidelines
- Fetch max 5000 characters per page load for long HTML PDFs using playwright.
- Summarize long compliance tables immediately before appending to synthesis.
