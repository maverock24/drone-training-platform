---
name: narrator-summary
description: Generate TTS-friendly narrator summaries from research synthesis. Pure flowing prose, no formatting, numbers spelled out, 3000-5000 words.
user-invocable: false
---

# Narrator Summary Skill

Use this skill when generating the TASK-FINAL narrator summary from a completed `research_synthesis.md`. The output is designed for text-to-speech playback — pure flowing prose with no visual formatting.

## Procedure

1. **Read** the complete `research_synthesis.md` to understand all findings.

2. **Plan the narrative arc:**
   - Context and motivation (why this research matters)
   - Area-by-area findings in a logical progression
   - Practical recommendations
   - Next steps and open questions

3. **Write in pure flowing prose:**
   - NO tables, bullet lists, headers, citations, or markdown formatting
   - Explain every technical term inline on first use
   - Spell out all numbers and percentages in words ("forty-two percent" not "42%")
   - Use a conversational, engaging tone suitable for audio playback

4. **Target 3,000–5,000 words.** If the synthesis is very large, focus on the most significant findings rather than trying to cover every detail.

5. **Do not introduce new information.** Only synthesize and narrate what was already researched and written in the synthesis.

6. **File creation rules:**
   - Use `create_file` for the output — never append to an existing file
   - If the file already exists, delete it first with terminal: `rm research_narrator_summary.md`
   - Write in chunks of 500–800 words if needed to avoid context window issues

7. **Structure the narrative** so that a listener can follow without seeing any visual aids. Transitions between topics should be explicit and smooth.
