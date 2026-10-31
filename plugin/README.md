# Blazing Video for Claude Code

Record your screen, face and voice on your Mac, edit the video by its
transcript, and share a link, all from Claude Code.

## Install

1. Install the **Blazing Video** Mac app from
   [blazingvideo.com/download](https://blazingvideo.com/download) (macOS 15
   or later), open it once and finish setup. It lives in the menu bar.
2. In Claude Code:

   ```
   /plugin marketplace add acstener/blazing-video-plugin
   /plugin install blazing-video@blazing-video
   ```

3. With Blazing Video running, say "record this", "cut the ums", or "give me
   a link to it".

The plugin adds two things:

- **The `blazing-video` MCP server**: an HTTP connection to the app's local server at
  `http://127.0.0.1:43120/mcp` (header `X-Takes: 1`). It only answers on your
  Mac and refuses browser requests. If Claude says it can't connect, open
  Blazing Video.
- **The `blazing-video` skill**: tells Claude the record → edit → share workflow, so
  plain requests like "tidy up my last video" work.

Without the plugin you can add the server yourself:

```
claude mcp add --transport http --scope user blazing-video http://127.0.0.1:43120/mcp --header "X-Takes: 1"
```

Using the Claude desktop app instead? Choose **Connect to Claude App…** in
Blazing Video's menu-bar menu; it downloads a connector for the Claude app
with the same tools.

## Tools

### Recording

| Tool | What it does |
|---|---|
| `start_recording` | Starts recording the screen, camera and mic. Returns once it's rolling. Options: `camera`, `microphone`, `systemAudio`. If the camera can't start, it returns a warning and does **not** record; call again with `camera: false`. |
| `wait_for_take` | Waits until the take stops (⌥⇧R, the island's Stop button, or `stop_recording`) and returns it with its transcript and share link, opened in the editor. Options: `take`, `timeoutSeconds` (default 900, max 3600). |
| `stop_recording` | Stops the recording and returns the take and its transcript, opened in the editor. |
| `recording_status` | Idle, starting, ready or recording; how long it's been rolling; the last finished take. |

### Opening and watching videos

| Tool | What it does |
|---|---|
| `understand_video` | Reads a whole video in one call: duration, resolution, a timestamped transcript and up to 12 key frames (`maxFrames` 0–30, `frameWidth` 320–1568). Takes any .mp4/.mov/.m4v (or audio file) by `path`, or the open take with no path. Imports the file as a take and opens it, so the editing tools work on it next. Nothing is uploaded. |
| `open_take` | Opens a take, or any video file (imported and transcribed on the Mac first), in the editor. With no path, opens the newest take. |
| `add_clip` | Adds another take or video to the end of the open take, or at `atMs` (optionally just part of it, with `inMs` / `durationMs`). The words carry on in one transcript. `remove` takes a clip back out. |

### Editing (the take open in the editor)

| Tool | What it does |
|---|---|
| `get_transcript` | Every word with its index, text, start/end time and whether it's cut, plus the current cuts, trim and durations. |
| `cut_ranges` | Cuts words by index (`wordIndices`) or time ranges in ms (`ranges`). `restore: true` brings them back. |
| `cut_fillers` | Cuts every um/uh-style filler word. |
| `tighten_pauses` | Shortens every pause over 0.4 s down to 0.15 s. |
| `trim` | Trims the start and/or end: `startWord` / `endWord` (first / last word to keep) or `startMs` / `endMs`. `clear: true` removes the trim. |
| `set_camera` | Places and styles the webcam: corner or `x`/`y`, `size`, `shape` (circle, rounded, square), `aspect` (1:1, 4:3, 3:4, 16:9), `zoom` and `panX`/`panY`, `visible`, `removeBackground`, `reset`. |
| `set_captions` | Animated burned-in captions timed to every kept word: `style` (clean, subtitles, bold-pop, beast, karaoke, word-box, one-word, marker, typewriter, keynote, serif), `customStyle` (any look field), `words` (per-word `emphasis` / `color` by transcript index), `position` / `x` / `y`, `size`, `lineLength`, `textColor`, `highlightColor`, `box`, `enabled`. |
| `save_subtitles` | An .srt or .vtt of the edit, timed to the edited video. |
| `set_background` | The studio look: the screen on a gradient wallpaper (dusk, ocean, aurora, mint, peach, snow, graphite) with `padding`, `roundness` and `shadow`. `enabled: false` goes back to full-frame. |
| `get_frame` | A PNG of the edited video at `timeMs` (after cuts), webcam included. `maxWidth` defaults to 1280. |
| `undo` | Undoes the last edit. Every edit above is one undo step. |

### Exporting and sharing

| Tool | What it does |
|---|---|
| `export` | Writes an MP4 to `~/Movies/Blazing Video` and returns the path. Options: `codec` (`hevc` default, or `h264` for compatibility), `height`, `fps` (30 or 60). |
| `share` | Returns a share link at once and copies it to the clipboard; the video uploads behind it. Sharing the same take again updates the **same** link. `wait: true` returns only once the link plays. Links are public (but unguessable), so only share when asked. |

## Examples

- "Record this." Claude starts recording, tells you to press ⌥⇧R when you're
  done, and has the transcript and link the moment you stop.
- "Cut the ums and long pauses, then give me a link." `cut_fillers`,
  `tighten_pauses`, `share`.
- "Drop the false start and the 'ok, stop' at the end." `get_transcript`,
  then `trim` and `cut_ranges`.
- "Put my face top-left as a rounded square and use the ocean background."
  `set_camera`, `set_background`, then `get_frame` to check.
- "Watch ~/Downloads/feedback.mov and turn it into a to-do list."
  `understand_video` with the path.

Recording, transcription and editing all happen on your Mac. Only `share`
uploads anything.
