---
name: takes
description: Record the user's screen, camera and mic with the Blazing Video Mac app, edit the take by its transcript (cut words, fillers, pauses), look at frames, and share a link. Use when the user says "record this", "let's do a take", "start/stop recording", "tidy up / edit my last video", "cut the ums", or "give me a link to it".
---

# Blazing Video

Blazing Video is a Mac app: a menu-bar recorder plus a transcript-first editor. Its tools come from the `takes` MCP server on the user's Mac (`127.0.0.1:43120`). If a call fails to connect, ask the user to open Blazing Video (it lives in the menu bar).

## Recording
1. `start_recording` — returns once it is actually rolling. If it returns a camera warning instead, it is NOT recording: tell the user why and offer `start_recording` with `camera: false`.
2. Tell the user it's rolling and to talk. Recording is live; do not call other tools meanwhile.
3. When they say they're done (they have to tell you in chat — saying "stop" out loud does nothing), call `stop_recording`. It returns the transcript and, when sharing is on, a link that already plays.

## Editing (the take open in the editor)
- `get_transcript` first: every word has an index `i`. Cuts are by word index.
- First pass: `cut_fillers`, then `tighten_pauses`.
- `trim` to cut dead air or a false start at the head, or the "ok, stop" at the tail: `startWord` / `endWord` are the first / last word index to KEEP (or `startMs` / `endMs` on the source clock — they snap to word boundaries unless `exact: true`). `clear: true` removes the trim. It's one undo step, and cuts inside the trimmed parts come back as they were when it's cleared.
- Then `cut_ranges` with `wordIndices` for false starts, repeated sentences (keep the best/last take of a line), and waffle. Keep the speaker's meaning and voice; never rewrite what they said.
- `get_frame` (edited time, ms) when visuals matter — e.g. check a cut doesn't land mid-gesture.
- Every edit is undoable with `undo` (one step at a time).
- Word times are force-aligned ~1 s after a take stops; cuts made by index stay correct when they land.

## Sharing
- `share` returns the link immediately (also copied to the clipboard). If the take was shared before, it updates the SAME link with the current edit — anyone who opens it later sees the new cut. Use `wait: true` only if the user needs it to be playable before you reply.
- `share` publishes to a public (unguessable) link: only share when the user asked for a link or to post it.

## Exporting
- `export` writes an MP4 to `~/Movies/Blazing Video` and returns the path. HEVC native by default; pass `codec: "h264"` for maximum compatibility.

## Tone
Be brief while recording. After editing, say in one or two sentences what you cut and the new length.
