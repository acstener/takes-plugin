---
name: blazing-video
description: Record the user's screen, camera and mic with the Blazing Video Mac app, watch any video file (transcript + key frames in one call), edit the take by its transcript (cut words, fillers, pauses), look at frames, and share a link. Use when the user says "record this", "let's do a take", "start/stop recording", "watch this video", hands you an .mp4/.mov path (feedback walkthrough, bug repro), "tidy up / edit my last video", "cut the ums", or "give me a link to it".
---

# Blazing Video

Blazing Video is a Mac app: a menu-bar recorder plus a transcript-first editor. Its tools come from the `blazing-video` MCP server on the user's Mac (`127.0.0.1:43120`). If a call fails to connect, ask the user to open Blazing Video (it lives in the menu bar).

## Recording
1. `start_recording` — returns once it is actually rolling. If it returns a camera warning instead, it is NOT recording: tell the user why and offer `start_recording` with `camera: false`.
2. Tell the user it's rolling, and to stop with ⌥⇧R or the island's Stop button when they're done.
3. Call `wait_for_take` straight away. It returns the moment the take stops (however it's stopped) with the transcript and, when sharing is on, a link that already plays, so you have the take as soon as they finish. If it's still rolling at the timeout, call it again. If they'd rather tell you in chat, call `stop_recording` instead.

## Watching a video (feedback, bug repros, demos)
- When the user hands you a video or audio file, call `understand_video` with its path. One call returns the duration and resolution, the transcript as timestamped sentence lines, and up to 12 key frames (the moments the screen changes) marked into the transcript as ▣n. A 5 min video takes a few seconds.
- It imports the video as a take and opens it in the editor, so `get_frame` (a closer look at any moment; raise `maxWidth` for small text), `cut_ranges`, `export` and `share` work on it next. Nothing is uploaded.
- After a take stops, `understand_video` with no path reads the take just recorded, e.g. "record my feedback, then map it out".
- Mapping out feedback: go through it in order, tie each point to its time and frame, and turn it into concrete items (what's wrong, where, what they want instead).

## Editing (the take open in the editor)
- `get_transcript` first: every word has an index `i`. Cuts are by word index.
- First pass: `cut_fillers`, then `tighten_pauses`.
- `trim` to cut dead air or a false start at the head, or the "ok, stop" at the tail: `startWord` / `endWord` are the first / last word index to KEEP (or `startMs` / `endMs` on the source clock — they snap to word boundaries unless `exact: true`). `clear: true` removes the trim. It's one undo step, and cuts inside the trimmed parts come back as they were when it's cleared.
- Then `cut_ranges` with `wordIndices` for false starts, repeated sentences (keep the best/last take of a line), and waffle. Keep the speaker's meaning and voice; never rewrite what they said.
- `add_clip` appends another take or video file to the open take (or drops it in at `atMs`, optionally just a stretch with `inMs`/`durationMs`); its words join the same transcript, so cuts, trim, export and share cover every clip. `remove` takes a clip back out.
- `get_frame` (edited time, ms) when visuals matter — e.g. check a cut doesn't land mid-gesture.
- `set_camera` places and styles the webcam over the screen: corner or x/y, size, shape (circle/rounded/square), aspect (1:1, 4:3, 3:4, 16:9), zoom and pan to reframe, hide it, or remove its background. Check the result with `get_frame`.
- `set_captions` burns in animated captions timed to every kept word. `style`: clean, subtitles, bold-pop, beast, karaoke, word-box, one-word, marker, typewriter, keynote or serif; `customStyle` changes any field of the look (fonts, colours, stroke, shadow, size, position, reveal, entrance, highlight); `words` styles single words by transcript index (`emphasis`, `color`) so the key words of a line pop; `position` top/middle/bottom or `x`/`y` anywhere; `size` 0.5–2; `lineLength` letters per line (rewraps the same words; long = one line, 0 = the look's own); `textColor` / `highlightColor` (#RRGGBB) and `box` on/off/auto, kept across looks. Check with `get_frame`. `save_subtitles` writes an .srt or .vtt of the edit.
- `set_background` gives the studio look: the screen inset on a soft gradient wallpaper (dusk, ocean, aurora, mint, peach, snow, graphite) with padding, rounded corners and a soft shadow; `enabled: false` goes back to full-frame.
- Every edit is undoable with `undo` (one step at a time).
- Word times are force-aligned ~1 s after a take stops; cuts made by index stay correct when they land.

## Sharing
- `share` returns the link immediately (also copied to the clipboard). If the take was shared before, it updates the SAME link with the current edit — anyone who opens it later sees the new cut. Use `wait: true` only if the user needs it to be playable before you reply.
- `share` publishes to a public (unguessable) link: only share when the user asked for a link or to post it.

## Exporting
- `export` writes an MP4 to `~/Movies/Blazing Video` and returns the path. HEVC native by default; pass `codec: "h264"` for maximum compatibility.

## Tone
Be brief while recording. After editing, say in one or two sentences what you cut and the new length.
