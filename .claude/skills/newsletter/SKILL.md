---
name: newsletter
description: Compile logged events, deals, asks, and news into a District Angels newsletter draft in the DA voice, ready to paste into Mailchimp. Use when the user says /newsletter, "draft the newsletter", "compile the newsletter", or asks to log a newsletter item ("log an event…", "add a deal to the newsletter…").
---

# Draft the District Angels newsletter

## If the user is LOGGING an item (not compiling)

Create a file in `newsletter/inbox/` from the matching `_TEMPLATE-*.md` (event / deal / ask / news), fill it with what they told you, ask only for genuinely missing essentials (an event needs a date), and commit. Deals: confirm the info is founder-approved before writing it — this repo is public.

## If the user is COMPILING an issue

### 1. Gather

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
- A `<!-- sources -->` comment at the bottom listing which inbox files and issue numbers fed the draft

Never publish a deal whose source has `founder_approved: false` or an unchecked approval box — list it at the bottom under "Held back" instead.

Show the user the draft and iterate until they approve.

### 4. Render for Mailchimp (after approval)

Inject the approved copy into `newsletter/mailchimp-template.html` (replace the `{{TOKEN}}` placeholders; delete unused section blocks between the `SECTION:` comments) and save as `newsletter/issues/YYYY-MM.html`. Tell the user: in Mailchimp choose **Create → Email → Code your own → Paste in code**, paste the file's contents, then pick audience and send.

### 5. Archive (after the user confirms it's sent or scheduled)

- Move the consumed inbox files to `newsletter/issues/YYYY-MM-items/`
- Close each consumed GitHub issue with a comment naming the issue it shipped in (e.g. "Sent in the 2026-08 newsletter")
- Commit everything

Do not archive or close anything until the user confirms the send.
