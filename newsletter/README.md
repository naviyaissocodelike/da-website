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

That's the entire logging step. No repo, no forms, no doc to maintain — the channel *is* the running log, and Claude reads it directly at compile time.

Fallbacks if Slack isn't handy: the GitHub issue forms (📅 Event / 💼 Deal / 🙋 Ask / 📣 News — good from the GitHub mobile app) or a file dropped in [`inbox/`](inbox/). All three surfaces get swept together.

**Images:** drop them straight in the channel next to the item they belong to. At compile time they get pulled out for the email — see "Images" below.

### 2. Compile — draft the issue

In a Claude session with the Slack connector (claude.ai/code works), run:

```
/newsletter
```

Claude sweeps everything posted in #da-internal-newsletters since the last issue (plus any `newsletter`-labeled GitHub issues and `inbox/` files), reads [`VOICE.md`](VOICE.md) and the previous issue for continuity, and writes a full draft to `issues/YYYY-MM.md` — subject line options, preview text, and every section written in the DA voice. Review it, ask for edits in plain English ("make the deal blurb punchier", "lead with the event").

### 3. Send — into Mailchimp

Once the draft is approved, Claude renders it into [`mailchimp-template.html`](mailchimp-template.html) (a brand-matched, email-safe template). In Mailchimp: **Create → Email → Code your own → Paste in code**, paste the rendered HTML, pick the audience, send or schedule. Claude then archives the inbox items and closes the logged issues so nothing gets double-sent.

You can also skip the custom template and paste the section copy into any Mailchimp editor block — the draft is written to work either way.

## Images

Slack-hosted images can't be used in emails — Slack file URLs require login, so they'd render as broken boxes for subscribers. Two ways to get channel images into the newsletter, both fine:

1. **Mailchimp content studio (simplest).** When assembling the send, download the image from Slack and drag it into Mailchimp — Mailchimp hosts it at a public URL automatically.
2. **This repo (for images you'll reuse).** Commit to `assets/newsletter/YYYY-MM/` — GitHub Pages serves it at a stable public URL that works in any email. Good for logos and recurring headers.

At compile time, Claude lists which images were posted in the channel and where each should go in the draft, so nothing gets lost.

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
