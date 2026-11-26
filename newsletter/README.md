# District Angels Newsletter

A lightweight pipeline for getting community updates out the door: capture items as they happen, let Claude compile them into a draft in the DA voice, paste into Mailchimp, send.

## The workflow

```
capture (30 seconds) ──▶ compile (/newsletter) ──▶ review & send (Mailchimp)
```

### 1. Capture — drop it in Slack

The capture surface is the **#da-internal-newsletters** Slack channel. When something happens, post it there — a sentence, a flyer, a forwarded message, a photo from an event. Prefix helps but isn't required:

```
Event: rooftop mixer Aug 14, 6pm, RSVP link coming
Deal: CurieDx SPV closing Friday — founder ok'd sharing
Ask: need two health-tech angels for Thursday's diligence call
Win: Cachai landed their first DoD pilot 🎉
```

That's the entire logging step for the team. Behind the scenes, an **n8n workflow** (see [`n8n/`](n8n/)) mirrors every channel message into a running Google Doc ([DA Newsletter Inbox](https://docs.google.com/document/d/1GJG638-s2p26Cxv8_AnyP3sfj_5xhm__GHrnnFZoI48/edit)) and saves any attached images to the [DA Newsletter Images](https://drive.google.com/drive/folders/1ErC49C4Vvsw3wgitwM1WhfYA1qFdmjCS) Drive folder — automatically, as things are posted. Nobody maintains the doc by hand.

Fallbacks if Slack isn't handy: the GitHub issue forms (📅 Event / 💼 Deal / 🙋 Ask / 📣 News — good from the GitHub mobile app) or a file dropped in [`inbox/`](inbox/). All surfaces get swept together.

**Images:** drop them straight in the channel next to the item they belong to — n8n saves them to Drive and logs a link in the doc, so nothing gets lost when Slack's free-plan history expires.

### 2. Compile — draft the issue

In a Claude session with the Google Drive connector (claude.ai/code works), run:

```
/newsletter
```

Claude reads the DA Newsletter Inbox doc in a single call — everything below the last `=== SENT ===` divider is this month's material (plus any `newsletter`-labeled GitHub issues and `inbox/` files). It reads [`VOICE.md`](VOICE.md) and the previous issue for continuity, and writes a full draft to `issues/YYYY-MM.md` — subject line options, preview text, and every section written in the DA voice. Review it, ask for edits in plain English ("make the deal blurb punchier", "lead with the event"). Reading one doc keeps the token cost of a compile minimal — Claude only touches Slack directly if the n8n mirror breaks.

### 3. Send — into Mailchimp

Once the draft is approved, Claude renders it into [`mailchimp-template.html`](mailchimp-template.html) (a brand-matched, email-safe template). In Mailchimp: **Create → Email → Code your own → Paste in code**, paste the rendered HTML, pick the audience, send or schedule. Claude then archives the inbox items and closes the logged issues so nothing gets double-sent.

You can also skip the custom template and paste the section copy into any Mailchimp editor block — the draft is written to work either way.

## Images

Images dropped in the channel are auto-saved by n8n to the [DA Newsletter Images](https://drive.google.com/drive/folders/1ErC49C4Vvsw3wgitwM1WhfYA1qFdmjCS) Drive folder, with a link logged in the running doc. That solves *saving* them — Slack's free plan expires old files, Drive doesn't.

For *using* them in the email: Slack and Drive URLs don't work in emails (they require login), so at send time either drag the image from Drive into **Mailchimp's content studio** (Mailchimp hosts it publicly — simplest), or commit reusable ones (logos, headers) to `assets/newsletter/YYYY-MM/` in this repo for a stable GitHub Pages URL. The compiled draft lists every image and where it should go, so nothing gets lost.

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
