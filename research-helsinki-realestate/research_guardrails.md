# Research Guardrails — Helsinki Studio Flat Investment Analysis

## Generated: 2026-04-05

---

## Source Quality Standards

### Minimum Credibility Requirements
- **Tier 1 (Preferred):** Government sources (tilastokeskus.fi, vero.fi, ara.fi, hel.fi), official statistics, legislation
- **Tier 2 (Trusted):** Institutional research (Hypo, PTT, KVKL, Isännöintiliitto, Suomen Vuokranantajat), bank market reports (Nordea, OP, Danske Bank)
- **Tier 3 (Acceptable with caution):** Major listing platforms (Oikotie, Etuovi, Vuokraovi) for real-time market data; major Finnish media (Helsingin Sanomat, Kauppalehti, Talouselämä, YLE)
- **Tier 4 (Use only when no higher-tier source exists):** Real estate blogs, investment forums, individual broker opinions — must always be flagged as [SINGLE_SOURCE] and cross-verified

### Source Priority for Specific Data Types
| Data Type | Primary Source | Verification Source |
|---|---|---|
| Sale prices by area | Tilastokeskus | Oikotie/Etuovi listing samples |
| Rental prices | ARA statistics | Vuokraovi/Oikotie listing samples |
| Transfer tax | Vero.fi | Suomen Vuokranantajat or bank guide |
| Rental income tax | Vero.fi | Veronmaksajat.fi or Suomen Vuokranantajat |
| Capital gains tax | Vero.fi | Veronmaksajat.fi |
| Vastike benchmarks | Isännöintiliitto | Listing samples (hoitovastike field) |
| Renovation costs | Isännöintiliitto, KVKL | Helsingin Sanomat, specialized articles |
| Market forecasts | PTT, Hypo | Bank reports, media summaries |

---

## Forbidden Sources

The following source types must **never** be cited:
- Generic AI-generated content aggregators (content farms, auto-generated SEO sites)
- Reddit, Suomi24, or anonymous forum posts (may be used for leads but never as citable evidence)
- Wikipedia for statistical claims (may be used to find primary source links only)
- Any site with domain names clearly designed to mimic official sources
- Real estate agent marketing materials presented as objective analysis
- Any source older than 2023 for market pricing or rental data (use only 2024–2026 data)
- Social media posts (Twitter/X, Instagram, TikTok, Facebook) as factual sources

---

## Citation Format

Use inline URL citations immediately after each factual claim:

```
The average price per square meter for a yksiö in Helsinki was €5,432 in Q4 2025 (source: https://tilastokeskus.fi/...).
```

For tables, include the source URL in a row below the table or in a footnote.

When multiple sources confirm the same fact, cite all of them:
```
...confirmed at 30% (sources: https://vero.fi/..., https://veronmaksajat.fi/...).
```

---

## Hallucination Prevention Rules

### Absolute Prohibitions
1. **Never fabricate URLs, DOIs, author names, publication dates, or statistical figures.**
2. **Never invent price data, rental data, vastike amounts, or tax rates.** If a number cannot be sourced, mark it as `[DATA NOT FOUND]`.
3. **Never attribute a claim to a source without having fetched and read that source in the current iteration.** Your context is stateless.
4. **Never present a single listing as representative of an entire neighborhood.** Require samples of ≥5 listings per area for generalization.
5. **Never present forecasts as certainties.** Always frame predictions with uncertainty language ("PTT forecasts...", "according to Hypo's projection...").
6. **Never present computed yields without showing the calculation.** Always show: yield = (annual rent − annual costs) / purchase price × 100.

### Data Integrity Rules
7. **Exact figures only.** Record the exact number from the source. Do not round €5,432/m² to €5,400/m².
8. **Currency and units.** Always specify €/m², €/month, or €/year. Never leave amounts ambiguous.
9. **Timestamps.** Always note the data period (e.g., "Q4 2025", "March 2026") when citing statistics.
10. **Finnish vs. English terms.** When a Finnish term is used (e.g., hoitovastike), provide the English translation on first use.

---

## Token Budget Guidelines

- **Maximum content extraction per page load:** 8,000 characters. If a page is longer, extract only the relevant section using `browser_evaluate` with targeted selectors.
- **Listing sampling:** For Oikotie/Etuovi/Vuokraovi, extract structured data (price, size, location, vastike) from listings rather than full page text. Sample 15–25 listings per query, not more.
- **Summarize before appending.** Do not paste raw page content into synthesis. Extract, interpret, and write concise findings with citations.
- **One topic per synthesis write.** Write findings to one section at a time. Do not attempt to update the entire synthesis in a single operation.

---

## Helsinki-Specific Research Guidelines

### Neighborhood Viability Filter
A neighborhood is only included in the final shortlist if it meets ALL of these criteria:
1. At least 3 yksiö listings found under €120,000 (velaton hinta) on current platforms
2. Public transport connection to central Helsinki in ≤30 minutes (metro, tram, or frequent bus)
3. At least 1 university campus reachable within 30 minutes by public transport
4. No widespread safety concerns documented in official city statistics

### Yhtiölaina Analysis Framework
When evaluating flats with yhtiölaina:
- Calculate the **total cost of ownership** = myyntihinta + remaining yhtiölaina = velaton hinta
- Compare this to the debt-free asking price of similar flats in the same area
- Record the **rahoitusvastike** (financing charge) separately from hoitovastike
- Note the yhtiölaina terms: interest rate, repayment schedule, remaining duration
- Flag any flat where yhtiölaina exceeds 60% of velaton hinta as HIGH RISK

### Renovation Risk Assessment
When evaluating building condition:
- Check building year. Prioritize buildings where putkiremontti is already completed or building is post-2000
- For 1960s–1980s buildings: check isännöitsijäntodistus for planned renovations (5-year plan / kunnossapitotarveselvitys)
- Estimate putkiremontti cost: typically €500–1,000/m² for yksiö (Helsinki, 2025–2026 prices)
- A pending putkiremontti can add €10,000–25,000 in future costs for a small studio — factor this into total cost

---

## Lessons Learned

> *This section will be populated by the Research Worker during execution as it encounters and resolves issues.*

| Date | Lesson | Context |
|---|---|---|
