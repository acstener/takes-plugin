#!/usr/bin/env node
// Takes connector for the Claude app: a stdio MCP server that forwards every
// JSON-RPC message to the Takes Mac app's local MCP endpoint
// (http://127.0.0.1:43120/mcp, reachable only from this Mac). No dependencies.
//
// If Takes isn't running, Claude still gets the tool list (a snapshot shipped
// in tools.json) and each tool call says how to fix it, instead of the whole
// connector failing to start.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const ENDPOINT = process.env.TAKES_MCP_URL || 'http://127.0.0.1:43120/mcp';
const VERSION = require('../manifest.json').version;
const OFFLINE_TOOLS = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'tools.json'), 'utf8')); } catch { return []; }
})();
const NOT_RUNNING = "Blazing Video isn't running. Open Blazing Video from Applications (it lives in the menu bar; download it at https://blazingvideo.com/download), then try again.";

function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }

async function forward(msg) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'x-takes': '1' },
    body: JSON.stringify(msg),
  });
  const text = await res.text();
  if (!text.trim()) return [];
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    return text.split('\n').filter((l) => l.startsWith('data:')).map((l) => JSON.parse(l.slice(5)));
  }
  const body = JSON.parse(text);
  return Array.isArray(body) ? body : [body];
}

// Takes is closed: answer what we can locally.
function offline(msg) {
  if (msg.id === undefined) return null; // notification
  switch (msg.method) {
    case 'initialize':
      return { jsonrpc: '2.0', id: msg.id, result: {
        protocolVersion: (msg.params && msg.params.protocolVersion) || '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'blazing-video', version: VERSION },
        instructions: 'Blazing Video records the screen, camera and mic on this Mac and edits the video by its transcript. ' + NOT_RUNNING,
      } };
    case 'tools/list':
      return { jsonrpc: '2.0', id: msg.id, result: { tools: OFFLINE_TOOLS } };
    case 'tools/call':
      return { jsonrpc: '2.0', id: msg.id, result: { isError: true, content: [{ type: 'text', text: NOT_RUNNING }] } };
    case 'ping':
      return { jsonrpc: '2.0', id: msg.id, result: {} };
    default:
      return { jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: NOT_RUNNING } };
  }
}

async function handle(msg) {
  try {
    for (const out of await forward(msg)) send(out);
  } catch (err) {
    const reply = offline(msg);
    if (reply) send(reply);
    if (msg.method === 'initialize') process.stderr.write(`takes connector: Takes not reachable at ${ENDPOINT} (${err.cause?.code || err.message})\n`);
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  for (const m of Array.isArray(msg) ? msg : [msg]) handle(m);
});
rl.on('close', () => process.exit(0));
