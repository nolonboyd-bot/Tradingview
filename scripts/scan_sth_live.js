#!/usr/bin/env node
// scan_sth_live.js — live M5 STH scanner from 8:30 AM ET
// Prints STH pivots to console only — NO chart drawings

import { execSync } from 'child_process';

const PORT     = process.env.TV_CDP_PORT || '9223';
const POLL_MS  = 5000;
const START_H  = 8;   // Boyd-Walk_Away rule: scan begins at 8:30 AM ET (PENDING-1)
const START_M  = 30;

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

function toET(ts) {
  return new Date(ts * 1000).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function etParts(ts) {
  const s = toET(ts);
  const [h, m] = s.split(':').map(Number);
  return { h, m };
}

function nowET() {
  const now = new Date();
  const s = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const [h, m] = s.split(':').map(Number);
  return { h, m, str: s };
}

// Track already-alerted STHs by bar timestamp
const alertedSTHs = new Set();

async function poll() {
  const { h, m, str } = nowET();

  // Don't scan before 9:00 AM ET
  if (h < START_H || (h === START_H && m < START_M)) {
    console.log(`[${str}] ⏳ Waiting for 8:30 AM ET...`);
    return;
  }

  const data = tv('ohlcv --bars 100');
  if (!data.success || !data.bars) return;

  const bars = data.bars;

  // Tag ET info
  bars.forEach(b => {
    const { h: bh, m: bm } = etParts(b.time);
    b.etH = bh;
    b.etM = bm;
    b.etStr = toET(b.time);
  });

  // Filter bars from 9:00 AM ET
  const filtered = bars.filter(b => b.etH > 9 || (b.etH === 9 && b.etM >= 0));

  if (filtered.length < 3) return; // need at least 3 bars to confirm a pivot

  // Scan for STH pivots — N=1 strict
  // Note: last bar is still forming, so only check up to length-2
  for (let i = 1; i < filtered.length - 1; i++) {
    const prev = filtered[i - 1];
    const cur  = filtered[i];
    const next = filtered[i + 1];

    if (cur.high > prev.high && cur.high > next.high) {
      if (!alertedSTHs.has(cur.time)) {
        alertedSTHs.add(cur.time);
        const time = nowET().str;
        console.log(`\n🔴 STH CONFIRMED  @ ${cur.etStr} ET  →  High: ${cur.high}`);
        console.log(`   prev: ${prev.high}  |  pivot: ${cur.high}  |  next: ${next.high}`);
      }
    }
  }
}

const { str } = nowET();
console.log(`🚀 M5 STH Scanner live — ${str} ET`);
console.log(`   Scanning from 8:30 AM ET | polling every ${POLL_MS / 1000}s`);
console.log(`   Ctrl+C to stop\n`);

poll();
setInterval(poll, POLL_MS);
