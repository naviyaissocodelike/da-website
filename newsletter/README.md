# District Angels Newsletter

A lightweight pipeline for getting community updates out the door: capture items as they happen, let Claude compile them into a draft in the DA voice, paste into Mailchimp, send.

## The workflow

```
capture (30 seconds) ──▶ compile (/newsletter) ──▶ review & send (Mailchimp)
```

### 1. Capture — log items the moment they happen

Two ways, pick whichever is closer to hand:

**A. GitHub issues (best from your phone).** Open a new issue in this repo and pick one of the forms: **📅 Event**, **💼 Deal**, **🙋 Community ask**, or **📣 News / win**. Fill in the few fields and submit. That's it — the item is logged and labeled `newsletter`.

> First-time setup: create a `newsletter` label in the repo (Issues → Labels → New label) so the forms can auto-apply it.

**B. Drop a file in `inbox/` (best mid-Claude-session).** Copy one of the `_TEMPLATE-*.md` files in [`inbox/`](inbox/), fill it in, commit. Or just tell Claude "log an event: …" and it will do it for you.

Rough notes are fine in both cases. Bullet fragments, voice-memo transcripts, a pasted Slack message — the compile step does the writing.

### 2. Compile — draft the issue

In a Claude Code session on this repo, run:

```
/newsletter
```

Claude gathers every open `newsletter`-labeled issue and every file in `inbox/`, reads [`VOICE.md`](VOICE.md) and the previous issue for continuity, and writes a full draft to `issues/YYYY-MM.md` — subject line options, preview text, and every section written in the DA voice. Review it, ask for edits in plain English ("make the deal blurb punchier", "lead with the event").

### 3. Send — into Mailchimp

Once the draft is approved, Claude renders it into [`mailchimp-template.html`](mailchimp-template.html) (a brand-matched, email-safe template). In Mailchimp: **Create → Email → Code your own → Paste in code**, paste the rendered HTML, pick the audience, send or schedule. Claude then archives the inbox items and closes the logged issues so nothing gets double-sent.

You can also skip the custom template and paste the section copy into any Mailchimp editor block — the draft is written to work either way.

## Directory map

| Path | What it is |
|---|---|
| `VOICE.md` | The DA voice guide — how the newsletter should sound |
| `inbox/` | Un-sent items waiting for the next issue |
| `issues/` | Every drafted/sent issue, one file per month |
| `mailchimp-template.html` | Email-safe HTML shell matching the website's design |

## ⚠️ This repo is public

It powers the public website via GitHub Pages, so anything committed here — inbox notes and logged issues included — is visible to anyone. For deals especially: **only log what the founder has approved for community distribution.** If you want to capture non-public deal notes (valuation, terms, diligence), keep those elsewhere, or move this `newsletter/` folder to a separate private repo later — the workflow transfers as-is.

## Cadence

Aim for monthly. The whole point of capture-as-you-go is that when the month rolls around, the newsletter has already written itself — compiling and sending should take under 30 minutes.
