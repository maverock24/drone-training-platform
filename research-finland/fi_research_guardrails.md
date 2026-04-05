# Finnish Tax-Optimized Investment Research — Guardrails

## Source Quality Standards (5-Tier Hierarchy)

| Tier | Source Type | Examples | Trust Level |
|------|-----------|----------|-------------|
| **1 — Authoritative** | Finnish government & regulatory | Vero.fi, Finlex.fi, Finanssivalvonta.fi (FIVA), Tilastokeskus (Statistics Finland) | Absolute — tax figures MUST cite Tier 1 |
| **2 — Institutional** | Central bank, pension authorities, industry bodies | Suomen Pankki (Bank of Finland), Eläketurvakeskus (ETK), Pörssisäätiö | High — cross-reference with Tier 1 when possible |
| **3 — Regulated Financial** | Licensed brokers, banks, fund providers | Nordnet.fi, Nordea.fi, OP.fi, Seligson.fi, Mandatum.fi, S-Pankki.fi, Danske Bank | High for fee data; verify tax claims against Tier 1 |
| **4 — Expert Media** | Established Finnish financial media | Kauppalehti.fi, Arvopaperi.fi, Salkunrakentaja.fi, Sijoittaja.fi, Veronmaksajat.fi | Medium-High — useful for commentary, must not be sole source for tax figures |
| **5 — Community** | Forums, blogs, social media | Reddit r/Omatalous, Vauva.fi sijoitus-keskustelu, Nordnet blog | Low — use only to identify topics or verify public sentiment, NEVER cite as authoritative |

## Mandatory Verification Rules

1. **Every tax rate, threshold, or rule** must be verified against Vero.fi or Finlex.fi as primary source.
2. **Every broker fee figure** must be sourced from the broker's own official fee schedule page.
3. **Every fund TER or cost figure** must be sourced from the fund provider's KIID/KID document or official fund page.
4. **No tax figure may be cited from a single source.** Minimum 2 independent sources for any numeric tax claim.
5. **2026 specificity:** If 2026 rates are not yet published, use the most recent confirmed rates and flag as `[2025 RATES — 2026 PENDING]`.

## Forbidden Sources

- Verosuunnittelu.com or any site offering paid tax advisory services as content marketing
- Any site with excessive advertising or content-farm characteristics
- Wikipedia (not forbidden for background reading, but NEVER cite as source)
- AI-generated content aggregators (sites that scrape and reword content)
- Any non-.fi domain for Finnish tax rate claims (always verify against .fi primary source)

## Citation Format

Use **inline URL citation** format:

```
The capital income tax rate in Finland is 30% on income up to €30,000 and 34% on income exceeding that threshold ([Vero.fi — Pääomatulot](https://www.vero.fi/...)).
```

For tables, use footnote-style:
```
| Item | Rate | Source |
|------|------|--------|
| Capital income up to €30,000 | 30% | [1] |

[1] Vero.fi — Pääomatuloverotus, accessed 2026-04-04
```

## Hallucination Prevention Rules

1. **Never fabricate URLs.** Every URL must be fetched and confirmed accessible by the worker agent.
2. **Never invent tax rates, thresholds, or percentages.** If a figure cannot be sourced, mark as `[DATA NOT FOUND]`.
3. **Never attribute a claim to a source without having fetched and read that source** in the current research iteration.
4. **Never infer 2026 rates from 2024 or earlier data** without explicitly flagging the extrapolation.
5. **Never translate Finnish tax terms without providing the original Finnish term** in parentheses on first use.
6. **Never assume tax rules are unchanged** from previous years — Finland frequently adjusts thresholds and rates.

## Finnish Language Handling

- When sources are in Finnish, extract the relevant data and present in English.
- Always provide the Finnish term in parentheses on first mention: "capital income tax (pääomatulovero)".
- For key concepts, maintain a bilingual approach: "equity savings account (osakesäästötili, OST)".
- If a Finnish term has no clean English equivalent, use the Finnish term as primary with English explanation.

## Token Budget Guidelines

- **Maximum fetch size:** 8,000 characters per webpage fetch. Summarize before appending to synthesis.
- **Maximum per-task output:** 600 words written to fi_research_synthesis.md per task.
- **Source registry entries:** Keep each source entry to one row in the table.
- **Activity log entries:** One row per action, max 100 characters in the Notes column.

## Calculation Standards

- **Currency:** All figures in EUR (€). No conversion to other currencies.
- **Tax year:** 2026 unless otherwise noted (flag if using 2025 rates).
- **Income assumptions:** Gross annual earned income €30,000–€50,000. Show worked examples at €35,000 and €45,000.
- **Investment horizon:** Show calculations for 1yr, 5yr, 10yr, and 20yr holding periods.
- **Return assumptions:** Use 7% nominal annual return for equities, 3% for bonds, 1% for deposits.
- **Rounding:** Tax amounts rounded to nearest €1. Percentages to 1 decimal place.

## Lessons Learned

_This section will be populated by the Research Worker agent as it encounters and resolves issues during execution._

| Date | Lesson | Impact |
|------|--------|--------|
