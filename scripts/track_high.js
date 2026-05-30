#!/usr/bin/env node
// track_high.js — auto-updates a horizontal line at the session high
// Usage: node track_high.js

import { execSync } from 'child_process';

const PORT = process.env.TV_CDP_PORT || '9223';
const POLL_MS = 5000; // check every 5 seconds

function tv(args) {
  try {
    const out = execSync(`tv ${args}`, {
      env: { ...process.env, TV_CDP_PORT: PORT },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    return JSON.parse(out.toString());
  } catch (e) {
    try { return JSON.parse(e.stdout?.toString() || '{}'); } catch { return {}; }
  }
}

let currentHigh = 0;
let lineEntityId = null;

function updateLine(newHigh) {
  // Remove old line if exists
  if (lineEntityId) {
    tv(`draw remove ${lineEntityId}`);
  }

  // Draw new line — use double-quoted JSON safe for Windows shell
  const overrides = `{"color":"#FF0000","linewidth":2}`;
  const result = tv(`draw shape -t horizontal_line --price ${newHigh} --text "Session High ${newHigh}" --overrides "${overrides.replace(/"/g, '\\"')}"`);
  if (result.entity_id) {
    lineEntityId = result.entity_id;
    console.log(`[${new Date().toLocaleTimeString()}] ✅ High updated → ${newHigh} (id: ${lineEntityId})`);
  }
}

async function poll() {
  const data = tv('ohlcv --summary');
  if (!data.success) {
    console.log(`[${new Date().toLocaleTimeString()}] ⚠️  No data — is TradingView connected?`);
    return;
  }

  const high = data.high;
  if (high > currentHigh) {
    currentHigh = high;
    updateLine(currentHigh);
  }
}

console.log(`🚀 Tracking session high every ${POLL_MS / 1000}s on port ${PORT}`);
console.log('   Press Ctrl+C to stop.\n');

// Initial draw
poll();
setInterval(poll, POLL_MS);
