# Takes for Claude Code

Record your screen, face and voice on your Mac, edit the video by its transcript, and share a link — all from Claude Code.

Needs the **Takes** Mac app running: download it from https://takes-share.golf-deals.workers.dev/download (macOS 15+).

```
/plugin marketplace add acstener/takes-plugin
/plugin install takes@takes
```

Then say "record this", "cut the ums", or "give me a link to it".

The plugin connects Claude Code to the app's local MCP server (`127.0.0.1:43120`, only reachable from your Mac) and adds a skill describing the record → edit → share workflow.
