# Study Again

A lightweight study companion that helps learners save credible lessons, practise in short sessions, and return to the questions they missed.

**Live demo:** https://study-again.neatgrebe1.chatgpt.site

## What works

- Three source-linked fractions lessons with answer explanations
- Missed questions appear first on the next attempt
- Save any lesson link with a personal note and use recall prompts
- Suggested review date based on the last session
- Browser-local progress with no account or server-side learner profile
- Text-first layout and offline app access after the first visit

## Run locally

```sh
python3 -m http.server 4175
```

Open http://localhost:4175. A local server is required for service-worker caching.

## How to demo

Open a curated lesson, answer one question incorrectly, and finish the session. Reopen it to see the missed question first. Save a personal lesson and try its recall prompts. Reload after disconnecting to see the app and saved notes remain available.

## Scope and limits

This is a capstone proof of concept, not a measured learning intervention. The interface is in English. Curated content is attributed to OpenStax in each lesson and in [CREDITS.md](CREDITS.md). User-added notes are not fact-checked. External source pages are not cached offline. Browser data disappears when the user clears local storage.

The app is plain HTML, CSS, and JavaScript with no runtime dependencies. App assets total about 43 KB before compression.
