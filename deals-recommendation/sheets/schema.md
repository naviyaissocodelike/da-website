# Google Sheet Schema (primary database)

One spreadsheet, four tabs. Tab names and column headers must match exactly — the
n8n workflow and `scripts/match_rules.js` reference them by name.

**Rule of thumb: n8n owns the status columns; humans own everything else.**
Multi-value cells (industries, stages, geography, founder types) are
comma-separated: `fintech, healthtech`. Casing/spacing/hyphens don't matter —
the matcher normalizes and applies the alias map from Config.

---

## Tab: `Contacts`

Copy-paste header row:

```
contact_id	email	first_name	last_name	organization	role_type	geography	investing_stage_pref	industries	founder_type_interests	min_check	max_check	can_help_with	do_not_contact	unsubscribed_deals	notes
```

| column | notes |
|---|---|
| `contact_id` | stable id, e.g. `C-0001`. Used in the log; never reuse. |
| `email` | required — rows without a valid email are skipped (counted as `no_email`). |
| `role_type` | only `investor` rows are matched. Others (founder, operator…) are ignored. |
| `geography` | regions they invest in, comma-separated. Blank = anywhere. |
| `investing_stage_pref` | e.g. `pre_seed, seed`. Blank or `any` = all stages. |
| `industries` | sectors of interest. Blank = generalist (matches every industry). |
| `founder_type_interests` | e.g. `technical, repeat, underrepresented`. Blank = no preference. |
| `min_check` / `max_check` | the raise-size band they play in, in dollars (e.g. `500000`). Blank = no band. Deal's `raise_amount` must fall inside. |
| `can_help_with` | free text; used to personalize the email opener. |
| `do_not_contact` / `unsubscribed_deals` | checkboxes; either one excludes the contact. |

## Tab: `Deals`

```
deal_id	company_name	one_liner	description	stage	round_type	raise_amount	industries	geography	founder_type_tags	deck_url	why_compelling	include_in_next_send	send_status	last_sent_at
```

| column | notes |
|---|---|
| `deal_id` | stable id, e.g. `D-0001`. |
| `stage` | same vocabulary as `investing_stage_pref` (`pre_seed`, `seed`, `series_a`, …). |
| `raise_amount` | dollars; `$1,500,000` or `1500000` both fine. |
| `why_compelling` | **your genuine take on the deal** — the single most important input to the email draft. |
| `include_in_next_send` | ☑ checkbox — tick to include the deal in the next cycle. |
| `send_status` | n8n-owned: blank → `SENT` / `REJECTED`. |
| `last_sent_at` | n8n-owned timestamp. |

## Tab: `Distribution_Log`

One row per (deal, investor) pair per cycle — this is the permanent
who-got-what record and the draft-editing surface.

```
cycle_id	deal_id	company_name	contact_id	contact_name	email	match_reasons	include	digest_subject	digest_body	status	sent_at	gmail_message_id
```

| column | notes |
|---|---|
| `cycle_id` | e.g. `2026-07-14-a`; groups one send cycle. |
| `match_reasons` | written by the matcher, e.g. `stage: seed; industry: fintech; geo: dc`. |
| `include` | ☑ default TRUE. **Untick to drop this pair before approving in Slack.** |
| `digest_subject` / `digest_body` | the drafted email (repeated on each of that investor's rows). **Edit freely before approving** — the send step re-reads these cells. |
| `status` | n8n-owned: `SUGGESTED` → `SENT` / `SKIPPED` / `REJECTED` / `FAILED`. `SENT`/`APPROVED` rows exclude that pair from future cycles. |

## Tab: `Config`

```
key	value
```

| key | default | meaning |
|---|---|---|
| `enforce_geography` | TRUE | require geo overlap when both sides specify one |
| `enforce_founder_type` | TRUE | require founder-type overlap when both sides tagged |
| `enforce_raise_band` | TRUE | require raise inside investor's min/max band when set |
| `industry_aliases` | `{}` | JSON map, e.g. `{"health tech":"healthtech","ai/ml":"ai"}` |
| `max_deals_per_digest` | 5 | cap deals per investor email |
| `sender_name` | — | e.g. `Naviya @ District Angels` |
| `email_signature` | — | appended verbatim to every email |
| `approval_channel` | — | Slack channel for the approval card, e.g. `#deal-review` |

Recommended: add data-validation dropdowns on `stage`, `role_type`, and
`investing_stage_pref` once the vocabulary settles, so typos can't silently
break matching. Until then, the Slack summary's exclusion counts
(`14 excluded: 9 industry, 3 stage…`) are your early-warning signal.
