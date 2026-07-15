# n8n workflows — import & setup

Four importable workflows, same pattern as `newsletter/n8n/da-newsletter-capture.json` (which is already built on the newsletter branch). Import each via **Workflows → ⋯ → Import from file**, attach credentials, replace the `*_HERE` placeholders, run one manual test, then **Activate**.

All four start on **Google Sheets** as the store (works today, zero new accounts). When the Supabase Brain goes live (Phase 1), only the Sheets nodes get swapped for Supabase nodes — the flows don't change.

---

## 1. `da-intake-capture.json` — Tally → Sheet + Slack + booking email

Kills the intake leak: the form submission instantly creates the record, alerts the team, and emails the booking link.

```
Tally webhook → normalize fields → ┬ append to "Intake" sheet
                                   ├ Slack alert
                                   └ Gmail: welcome + booking link
```

Setup:
1. Create an **Intake** sheet (or a new tab in the existing one) with header row:
   `submitted_at | name | email | linkedin | interest | source | status | nudge_count | last_nudged`
2. Import, attach **Google Sheets**, **Slack**, and **Gmail** credentials.
3. Replace `INTAKE_SHEET_ID_HERE`, `ALERT_CHANNEL_ID_HERE`, `BOOKING_URL_HERE` (Cal.com / Calendly / Google appointment link).
4. In Tally: **Integrations → Webhooks** → paste the n8n webhook URL (n8n shows it on the Webhook node — use the *production* URL after activating).
5. Even better: also set the Tally form's **redirect on completion** to the booking page, so most people book before the email even lands.

## 2. `da-intake-nudges.json` — day 2 / 5 / 10 follow-ups

The "they forget, we forget" fix. Daily at 9am, finds rows with `status = new` that are due a nudge, sends it, increments the counter. After the third nudge the row flips to `dormant` (newsletter-only).

Setup: import, attach Sheets + Gmail credentials, replace `INTAKE_SHEET_ID_HERE` and `BOOKING_URL_HERE`. When someone books or you meet them, set their row's `status` to `call_booked` (or anything ≠ `new`) and nudges stop. If your scheduler webhook can do it, automate that flip too (Cal.com → n8n webhook → update row).

## 3. `da-brain-capture.json` — #da-brain paragraph → structured contact proposal

Paste "met Sara at the mixer, ex-Stripe, angels in fintech, $10–25k checks, happy to host" into **#da-brain**. Claude parses it into a structured contact card, logs it to the **Pending** tab, and replies in-thread with the proposal.

```
Slack #da-brain message → Claude (structured output) → ┬ append to "Pending" tab
                                                       └ threaded proposal + "react ✅ to commit"
```

Setup:
1. Create a **DA Brain** sheet with two tabs:
   - `Pending`: `slack_ts | raw_text | status | full_name | email | linkedin_url | city | types | sectors | stages | check_size | offers | notes`
   - `People`: same columns minus `slack_ts | raw_text | status`, plus `updated_at`
2. Create a `#da-brain` Slack channel; add the Slack app to it.
3. Import, attach **Slack** and **Google Sheets** credentials.
4. The Claude node uses an **HTTP Header Auth** credential: header name `x-api-key`, value = an Anthropic API key (console.anthropic.com → API keys).
5. Replace `DA_BRAIN_CHANNEL_ID_HERE` (both nodes) and `BRAIN_SHEET_ID_HERE`.

## 4. `da-brain-commit.json` — ✅ reaction → committed to the Brain

React **✅ on your original message** (not the bot's reply) and the pending record moves into the `People` tab; the bot confirms in-thread. Any other reaction (or none) leaves it pending — nothing enters the Brain without a human ✅.

Setup: import, attach Slack + Sheets credentials, replace the same two placeholders. Requires the Slack app to have the `reactions:read` scope.

---

## Notes

- **Threaded replies:** if the "reply in thread" option doesn't map cleanly after import (n8n Slack node versions vary), open the Slack node and set *Options → Thread TS* to the shown expression manually.
- **Transcripts next:** the same capture→propose→✅ loop extends to call transcripts — a Fathom/Fireflies webhook replaces the Slack trigger, everything downstream is identical. That's the next workflow to add here.
- **Supabase swap (Phase 1):** replace each Google Sheets node with a Supabase node (or HTTP request to the Supabase REST API) pointed at the tables in `../supabase/da-brain-schema.sql`. `Pending` ↔ `pending_updates`, `People` ↔ `people`, `Intake` ↔ `people` with `status='new'`.
