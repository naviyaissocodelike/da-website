---
name: newsletter
description: Compile logged events, deals, asks, and news into a District Angels newsletter draft in the DA voice, ready to paste into Mailchimp. Use when the user says /newsletter, "draft the newsletter", "compile the newsletter", or asks to log a newsletter item ("log an event…", "add a deal to the newsletter…").
---

# Draft the District Angels newsletter

## If the user is LOGGING an item (not compiling)

Post it to #da-internal-newsletters (ID `C08HSD1LNN9`) via the Slack connector, formatted as one message with the right prefix (`Event:` / `Deal:` / `Ask:` / `Win:`) and whatever details they gave you — that keeps all items in one place. Ask only for genuinely missing essentials (an event needs a date). If Slack isn't connected in this session, fall back to creating a file in `newsletter/inbox/` from the matching `_TEMPLATE-*.md` and commit. Deals: confirm the info is founder-approved before logging — the repo is public and the newsletter goes to the whole list.

## If the user is COMPILING an issue

### 1. Gather

- **Primary: the "DA Newsletter Inbox" Google Doc** (ID `1V47wotuE1oRBUKdpfAI8_0WsoWuSlaKweh8PnM1bqZU`) — read it in ONE call via the Google Drive connector. n8n mirrors every #da-internal-newsletters message into it, so this doc is the complete capture log. Only entries **below the last `=== SENT: YYYY-MM ===` divider** are new. Each entry is `[date] author: text`, with `IMAGE: <drive link>` lines for saved attachments (files live in the "DA Newsletter Images" Drive folder, ID `1L4H6cLyZp7YnJyOARMvvObxe1N0U6wFB`). Classify each entry as event / deal / ask / news from its content ("Event:", "Deal:" prefixes help but aren't required). Do NOT sweep the Slack channel directly unless the doc is missing/empty or the user says the n8n mirror is broken — the doc read is the cheap path.
- Every non-template file in `newsletter/inbox/`
- Every **open** GitHub issue labeled `newsletter` in this repo (use `gh issue list --label newsletter --state open` or the GitHub MCP tools, whichever is available)
- Skim `news.html` for reports added since the last issue

If there's nothing to compile, say so and stop.

### 2. Read for voice and continuity

- `newsletter/VOICE.md` — non-negotiable style rules and section order
- The most recent file in `newsletter/issues/` — don't repeat items, keep the tone consistent

### 3. Draft

Write `newsletter/issues/YYYY-MM.md` (current year-month) containing:

- **3 subject line options** (under 50 chars, concrete, no clickbait) + **preview text** (~80 chars)
- Full copy in the VOICE.md section order, skipping empty sections
- The opener written in first person — flag it clearly as the section the sender will most want to personalize
- An **Images** list: every `IMAGE:` entry from the doc, which section it belongs in, with its Drive link — and a reminder that Drive/Slack URLs don't work in email; each image must be uploaded to Mailchimp's content studio (download from Drive, drag in) or committed to `assets/newsletter/YYYY-MM/` for a public GitHub Pages URL
- A `<!-- sources -->` comment at the bottom listing the doc entry dates, inbox files, and issue numbers that fed the draft

Never publish a deal whose source has `founder_approved: false` or an unchecked approval box — list it at the bottom under "Held back" instead.

Show the user the draft and iterate until they approve.

### 4. Render for Mailchimp (after approval)

Inject the approved copy into `newsletter/mailchimp-template.html` (replace the `{{TOKEN}}` placeholders; delete unused section blocks between the `SECTION:` comments) and save as `newsletter/issues/YYYY-MM.html`. Tell the user: in Mailchimp choose **Create → Email → Code your own → Paste in code**, paste the file's contents, then pick audience and send.

### 5. Archive (after the user confirms it's sent or scheduled)

- Append a `=== SENT: YYYY-MM ===` divider line to the bottom of the DA Newsletter Inbox doc so the next compile starts below it. (If the Docs connector can't append, ask the user to add the line — it's one keystroke.)
- Optionally offer to post a wrap-up in #da-internal-newsletters ("📬 The YYYY-MM issue went out — everything above this message is in it"), but only send it if the user says yes.
- Move any consumed inbox files to `newsletter/issues/YYYY-MM-items/`
- Close each consumed GitHub issue with a comment naming the issue it shipped in (e.g. "Sent in the 2026-08 newsletter")
- Commit everything

Do not archive or close anything until the user confirms the send.
