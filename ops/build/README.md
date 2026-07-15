# DA Build Plan — what needs building, what's built, what's next

Companion to [`../OPERATING-SYSTEM.md`](../OPERATING-SYSTEM.md). That doc is the *what and why*; this directory is the *build*. Everything follows the pattern the newsletter pipeline already proved: **a Slack surface in, an agent in the middle, a human ✅, a store underneath.**

## Status legend

| | Meaning |
|---|---|
| ✅ **Built** | Exists and only needs activation (import + credentials) |
| 📦 **In this repo** | Built now — importable/runnable files in this directory |
| 🔧 **Next** | Buildable immediately once the piece before it lands |
| ⏳ **Blocked** | Waiting on an account, API key, or a decision |

## Component inventory

### Data layer

| Component | What it does | Status | Needs |
|---|---|---|---|
| Supabase schema | The Brain: people, orgs, deals, commitments, events, sponsorships, intros, open items, pending updates | 📦 `supabase/da-brain-schema.sql` | A free Supabase project — paste the SQL, done |
| Google Sheet view | Read-only comfort layer synced from the Brain | 🔧 | Supabase project first |
| Tag backfill sprint | Existing contacts exported → agent proposes tags → team confirms in batches | 🔧 | Export of current sheet |

### Capture (writes to the Brain)

| Component | What it does | Status | Needs |
|---|---|---|---|
| Newsletter capture | #da-internal-newsletters → Google Doc + Drive images | ✅ `newsletter/n8n/da-newsletter-capture.json` (newsletter branch) | Import into n8n + 4 credentials |
| Intake capture | Tally webhook → sheet + Slack alert + booking email | 📦 `n8n/da-intake-capture.json` | Sheet, booking link, Tally webhook |
| Intake nudges | Day 2/5/10 automated follow-ups, then dormant | 📦 `n8n/da-intake-nudges.json` | Same sheet |
| #da-brain parser | Free-text paragraph → Claude → structured contact proposal | 📦 `n8n/da-brain-capture.json` | #da-brain channel, Anthropic API key |
| ✅ commit flow | Reaction on original message → record enters the Brain | 📦 `n8n/da-brain-commit.json` | Same |
| Luma CSV import | RSVPs stay on Luma free; guest CSV dropped in a watched Drive folder → people upserted + attendance logged + Slack summary | 📦 `n8n/da-luma-csv-import.json` | Create the *Luma Imports* Drive folder |
| Transcript capture | Fathom/Fireflies webhook → same parse-and-✅ loop as #da-brain | 🔧 | Recorder account webhook (Fathom already in use) |

### Content & comms (reads from the Brain)

| Component | What it does | Status | Needs |
|---|---|---|---|
| Newsletter compile | `/newsletter` Claude skill: inbox doc → draft in DA voice → Mailchimp HTML | ✅ `.claude/skills/newsletter` + `newsletter/VOICE.md` + `mailchimp-template.html` (newsletter branch) | Merge the branch; run monthly |
| Content engine | One event/deal description → LinkedIn post + Luma listing + member email, approved in Slack | 🔧 | VOICE.md (exists); same skill pattern as /newsletter |
| Open-items digest | Mon/Thu bot post of open items by owner | 🔧 | Brain live (open_items table) |
| MD weekly brief | Monday auto-draft from the week's Brain deltas + Slack highlights | 🔧 | Brain live; same skill pattern |
| Post-event automation | T+1 recap + thanks drafts, attendance import, tagging | 🔧 | Luma CSV import running |
| Sponsor reminders | Pre-event benefit checklist to #ops, post-event proof recap | 🔧 | sponsorships table populated |

### Revenue & growth

| Component | What it does | Status | Needs |
|---|---|---|---|
| Outreach pipeline | One tracker for all cold/warm outreach (sponsors, angels, founders, partners, grant-makers): agent-drafted personalized emails, Slack approval, Gmail reply detection flips stages, day-4/9 follow-ups, weekly digest | 🔧 | n8n Gmail watch; `outreach` table in schema (works on a sheet first) |
| Points ledger | Incentive engine — auto-derived from Brain events (deals brought, referrals, connects, deal feedback, attendance); fee waivers + exclusive invites at renewal | 📦 schema (`points_ledger` + balance view) | Supabase live |
| Grants pipeline | Econ-dev grants tracked like deals (identified → LOI → application → awarded → reporting); quarterly Ecosystem Impact Report auto-drafted from Brain metrics | 🔧 | `grants` table ready; target funder list |
| Sponsor packages + event P&L | Category-exclusive annual partners; per-event cash + in-kind fair value − cost → cost per activated angel | 📦 schema fields | Populate per event |
| Happy-hour curation | Rule-of-thirds invite list proposed by agent from engagement scores | 🔧 | Luma CSV imports flowing |

### Deals & investment

| Component | What it does | Status | Needs |
|---|---|---|---|
| Founder intake | Notion form (exists today) → deal record in Brain | 🔧 | Wire the form output into the Brain (form stays; the portal moves off Notion) |
| Deal portal v1 | Custom Supabase portal: magic-link login, deal list, deal pages, four interest buttons, private comments | 🔧 | Supabase project (decided: Notion out) |
| Interest buttons | Committed / Interested / Watching / Pass → commitments table | 🔧 | Ships inside portal v1 |
| Diligence automation | Auto checklist, expert match from Brain, question synthesis, memo draft | 🔧 | Deals in the Brain |
| SPV tracking | Threshold alert, doc-status nudges via Play Money (decided — already a DA partner) | 🔧 | Deals in the Brain |

### Deferred (by design)

Member matching, referral impact reports, volunteer onboarding automation, embassy activation — all Phase 3+; the schema already has their tables/columns so nothing needs re-architecting.

## Decisions & accounts needed (the actual blockers)

1. **Supabase project** — free tier, 10 minutes; unblocks the whole data layer
2. **Anthropic API key** — for the #da-brain parser (and every agent after it)
3. **Booking link** — Cal.com / Calendly / Google appointment schedule; unblocks the intake fix
4. ~~Luma API~~ — not needed: RSVPs stay on Luma free; guest CSVs drop into a watched Drive folder and the import workflow (in this repo) does the rest
5. ~~Portal decision~~ — decided: custom Supabase portal (Notion out); founder intake form stays on Notion for now
6. ~~SPV decision~~ — decided: Play Money (already a DA partner)

## Build order

```
Week 1  Import the 6 n8n workflows (newsletter + 5 in this repo) · create booking link · shorten Tally form
Week 2  Supabase project + schema · start tag backfill · open-items digest
Week 3  Luma CSV import live · transcript capture · content-engine skill · portal v1 started
Week 4  MD brief skill · deal records in Brain · post-event automation
```
