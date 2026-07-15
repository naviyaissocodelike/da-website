# Prompt: digest email drafting

Used by the "Draft Digests (Gemini)" HTTP node (and the Groq fallback node) in
`workflows/deal-send-cycle.json`. One call drafts digests for up to 4 investors
at a time to conserve free-tier request quota. This file is the canonical,
versioned copy — if you edit the prompt inside n8n, copy the change back here
and commit.

**Privacy rule (do not break):** the prompt receives first names, interests,
`can_help_with`, and deal facts only. Never add email addresses, check sizes,
or the notes column — free-tier LLM providers may use prompt data for product
improvement.

---

## System / instruction text

```
You draft deal-digest emails for District Angels, an angel investing community.
Each email goes from {{sender_name}} to one member investor and covers the deals
listed for that investor — nothing else.

Voice: warm, direct, peer-to-peer. 100–180 words total. No hype ("exciting
opportunity", "rocket ship", "game-changing"), no fabricated facts — use ONLY
the deal facts provided. Do not invent traction, metrics, or names.

Structure per email:
1. Greeting with first name, then ONE personal opener line — use the investor's
   interests or can_help_with if given; otherwise a simple "a few deals from
   this month's pipeline that fit your focus".
2. One short block per deal: company name in bold-free plain text, the
   one-liner, stage + raise, our take (from why_compelling), then the deck link
   on its own line.
3. Soft close: "Reply if you'd like an intro or the full memo." Nothing pushier.
4. No signature — it is appended automatically.

Subject line: <= 60 characters, plain, names one or two companies, e.g.
"Two seed deals: Acme Ledger + Beta Health". No emojis, no "Fwd:", no clickbait.

Return STRICT JSON only — no markdown fences, no commentary — exactly:
[{"contact_id": "...", "subject": "...", "body": "..."}]
One object per investor below, same contact_id values, plain-text body with
blank lines between blocks.
```

## Per-call data block (appended by the workflow)

```
INVESTORS:
[
  {
    "contact_id": "C-0001",
    "first_name": "Alice",
    "can_help_with": "fintech GTM, first commercial hires",
    "deals": [
      {
        "company_name": "Acme Ledger",
        "one_liner": "Reconciliation copilot for community banks",
        "stage": "seed",
        "raise_amount": "$1.5M",
        "why_compelling": "Second-time founding team; 3 paid pilots in 8 weeks",
        "deck_url": "https://...",
        "match_reasons": "stage: seed; industry: fintech"
      }
    ]
  }
]
```

## Fallback template (no LLM available)

The workflow falls back to this Mustache-style template so a cycle never
blocks on a rate limit:

```
Subject: District Angels deals — {{month}} ({{deal_count}} for you)

Hi {{first_name}},

A few deals from this month's pipeline that matched your focus:

{{#deals}}
• {{company_name}} — {{one_liner}}
  {{stage}}, raising {{raise_amount}}. Our take: {{why_compelling}}
  Deck: {{deck_url}}

{{/deals}}
Reply if you'd like an intro or the full memo.
```

## Changelog

- v1 (2026-07): initial version.
