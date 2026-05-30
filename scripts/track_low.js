#!/usr/bin/env node
// track_low.js — auto-updates a horizontal line at the session low
import { execSync } from 'child_process';

const PORT = process.env.TV_CDP_PORT || '9223';
const POLL_MS = 5000;

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

let currentLow = Infinity;
let lineEntityId = '1ztrhA'; // existing red low line

function updateLine(newLow) {
  if (lineEntityId) tv(`draw remove ${lineEntityId}`);
  const result = tv(`draw shape -t horizontal_line --price ${newLow} --text "Session Low ${newLow}" --overrides "{\\"color\\":\\"#FF0000\\",\\"linewidth\\":2}"`);
  if (result.entity_id) {
    lineEntityId = result.entity_id;
    console.log(`[${new Date().toLocaleTimeString()}] 🔴 Low updated → ${newLow} (id: ${lineEntityId})`);
  }
}

async function poll() {
  const data = tv('ohlcv --summary');
  if (!data.success) { console.log(`[${new Date().toLocaleTimeString()}] ⚠️  No data`); return; }
  const low = data.low;
  if (low < currentLow) {
    currentLow = low;
    updateLine(currentLow);
  }
}

console.log(`🚀 Tracking session low every ${POLL_MS / 1000}s on port ${PORT}`);
console.log('   Press Ctrl+C to stop.\n');

poll();
setInterval(poll, POLL_MS);
