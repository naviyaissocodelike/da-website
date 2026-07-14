# n8n capture workflow

`da-newsletter-capture.json` mirrors every message in **#da-internal-newsletters** into a running Google Doc, and saves any attached images to a Drive folder — so compiling the newsletter only ever means reading one doc.

## Targets (already created)

- **Running doc:** [DA Newsletter Inbox](https://docs.google.com/document/d/1V47wotuE1oRBUKdpfAI8_0WsoWuSlaKweh8PnM1bqZU/edit) — doc ID `1V47wotuE1oRBUKdpfAI8_0WsoWuSlaKweh8PnM1bqZU`
- **Image folder:** [DA Newsletter Images](https://drive.google.com/drive/folders/1L4H6cLyZp7YnJyOARMvvObxe1N0U6wFB) — folder ID `1L4H6cLyZp7YnJyOARMvvObxe1N0U6wFB`

## Import steps

1. In n8n: **Workflows → ⋯ → Import from file** → pick `da-newsletter-capture.json`.
2. Attach credentials to four nodes:
   - **Slack Trigger** → your Slack app credential. The app needs `channels:history`/`groups:history` (it's a private channel, so `groups:history`), `files:read`, and must be **added to #da-internal-newsletters**.
   - **Download from Slack** (HTTP Request) → the same Slack credential (it authenticates the file download).
   - **Append to inbox doc** and **Log image link in doc** → your Google Docs credential.
   - **Save image to Drive** → your Google Drive credential.
3. Run once manually with a test post in the channel, then **Activate**.

## What it does per message

- Skips bot posts and join/leave noise.
- Appends `[date] author: text` to the bottom of the running doc.
- If the message has attachments: downloads each from Slack, saves to the Drive folder (date-prefixed filename), and appends `IMAGE: <drive link>` under the entry.

## Notes

- Thread replies also fire the trigger and get logged — that's intentional (corrections land in the doc too).
- After an issue ships, add a line `=== SENT: YYYY-MM ===` to the doc (the compile step does this) so the next compile starts below it.
- If you rename/move the doc or folder, update the two IDs in the workflow.
