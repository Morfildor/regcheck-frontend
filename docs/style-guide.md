# RuleGrid Content Style Guide

Version 1.0 — March 2026

---

## Purpose

This guide sets the standards for all copy in the RuleGrid product: UI labels, directive summaries, result copy, onboarding text, and any documentation or help content. Its goal is to ensure that every piece of text is accurate, accessible, and useful to the reader — without unnecessary jargon or padding.

---

## Tone and voice

### Plain and professional

Write as if you are a competent colleague explaining something clearly over email — not a legal disclaimer, not a sales pitch.

**Do:**
- Use direct, active sentences.
- Write for the person who is reading the screen right now.
- Give the information the reader needs; stop there.

**Avoid:**
- Passive constructions ("it is required that…") where active voice works.
- Filler phrases: "Please note that…", "It is important to understand that…", "In the context of…"
- Jargon the reader has not been introduced to. If a term is essential, define it on first use.

### Active voice

| Passive (avoid) | Active (prefer) |
|---|---|
| "The CE mark is required to be affixed…" | "Affix the CE mark before placing the product on the market." |
| "Testing must be carried out by an accredited body." | "Have an accredited body carry out the tests." |
| "It has been determined that the product is in scope." | "The product is in scope." |

### Present tense for current facts

Use present tense for facts that are currently true. Use future tense only for obligations that will come into force later.

- Present: "The LVD applies to electrical equipment operating at 50–1 000 V AC."
- Future: "The CRA cybersecurity obligations apply from December 2027."

---

## Reading level

Target: **Grade 12 or lower** (Flesch–Kincaid) for all interface copy and directive summaries. B2B readers are technically capable but are reading under time pressure.

Practical rules:
- Keep sentences under 25 words where possible.
- Prefer one idea per sentence.
- Use bullet lists for three or more items instead of a long sentence.
- Avoid nominalizations: write "require" not "requirement," "apply" not "application of," where the verb form is natural.

---

## Regulatory accuracy

### Cite the regulation precisely

Every directive or regulation summary must include:
- The **short name** (e.g., "Low Voltage Directive")
- The **official designation** (e.g., "2014/35/EU")
- A link to the **EUR-Lex official text**

Example:
> The Low Voltage Directive (2014/35/EU) applies to electrical equipment operating between 50–1 000 V AC or 75–1 500 V DC and requires products to be safe for users.

### Distinguish scope from obligation

Be precise about what the regulation *covers* (scope) and what it *requires* (obligation).

- Scope: "The EMC Directive applies to electrical apparatus that can cause electromagnetic disturbance…"
- Obligation: "Manufacturers must test emissions and immunity against the applicable harmonised standards."

### Voltage ranges

Always include both AC and DC ranges when describing the LVD scope. Do not quote just "50 V to 1 000 V" without the DC equivalent.

---

## UI copy conventions

### Labels and headings

- Use **title case** for top-level section headings (e.g., "Standards Route", "Missing Information").
- Use **sentence case** for sub-labels and field labels (e.g., "Product description", "Power source").
- Avoid ending labels with colons in the UI; the visual layout provides the association.

### Button text

- Use **imperative verbs**: "Analyze product", "Open email draft", "Copy summary".
- Avoid vague labels: "Submit", "Click here", "Go".

### Error messages

- State what went wrong: "Enter a valid email address."
- Tell the user how to fix it: "Select at least one power source before continuing."
- Do not blame the user: avoid "You forgot to fill in…" or "Invalid input."

### Status messages and feedback

- Completed actions: use past tense. "Analysis complete."
- In-progress: use present continuous. "Analyzing product…"
- Errors: use plain description. "Analysis failed — try again."

---

## Directive summaries (for /public/directives/*.md)

Each directive file must include:

1. **One-sentence scope statement** — what the regulation covers and the key threshold or trigger.
2. **In-scope product examples** — a bulleted list, 3–6 items.
3. **Key obligations** — numbered list, plain language.
4. **Interaction note** — how this directive relates to 1–3 others.
5. **EUR-Lex link** — link to the official consolidated text.
6. **Disclaimer footer** — the standard RuleGrid disclaimer (see below).

### Standard disclaimer footer

> *RuleGrid uses this summary for first-pass scoping only. For formal conformity assessment, consult an accredited test laboratory or a qualified compliance expert.*

---

## Formatting conventions

### Numbers and units

- Always include the unit: "230 V AC", "50 Hz", "1 000 V", "0.1 %".
- Use a non-breaking space between a number and its unit in HTML: `50&nbsp;V`.
- Use "%" not "percent" in tables and data-dense contexts; spell out in prose.
- Separate thousands with a thin space or comma consistently: "1 000" or "1,000" — pick one and be consistent (EU convention uses spaces; this guide uses spaces for consistency with EUR-Lex texts).

### Dates

- Write month names in full: "August 2025", not "08/2025".
- Use ISO 8601 (YYYY-MM-DD) in code and metadata; use "Month YYYY" in prose.

### Lists

- Use bullet lists for unordered items (three or more).
- Use numbered lists only for steps or ranked items.
- Keep list items grammatically parallel.
- Do not use semicolons at the end of list items.

### Tables

- Use tables for comparative data (voltage ranges, substance limits, standard applicability).
- Provide a column header for every column.
- Do not use tables for layout — use CSS.

---

## Accessibility requirements for content

- Every image and icon must have a text alternative (`alt` attribute or `aria-label`).
- Decorative images must have `alt=""`.
- Link text must describe the destination: "View LVD official text" not "Click here".
- Use `<abbr>` for abbreviations on first use if the abbreviation is not universally known in the audience.
- Avoid using colour alone to convey meaning (e.g., red text for errors must also include a text label or icon).

---

## What to avoid

| Avoid | Reason |
|---|---|
| AI-generated filler ("This directive is crucial for ensuring…") | Vague, adds no information |
| "Please be aware that…" | Unnecessary preamble |
| "It should be noted that…" | Padding |
| Hedging everything ("may", "might", "could" for established facts) | Reduces trust and clarity |
| Unexplained acronyms on first use | Excludes readers unfamiliar with the term |
| Overlapping obligations stated twice in the same sentence | Redundant |
| Marketing superlatives ("the most comprehensive…") | Out of tone for a B2B compliance tool |

---

*This style guide is maintained by the RuleGrid team. Propose changes via a pull request to `/docs/style-guide.md`.*
