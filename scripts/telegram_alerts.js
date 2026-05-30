#!/usr/bin/env node
// telegram_alerts.js — Boyd-Walk_Away core alerts
//
// Step 1: Identify M5 STH from 8:30 AM ET
// Step 2: Alert when a bar wicks ABOVE the STH → bullish confirmed
//
// No chart drawings. Console + Telegram only.

import { execSync } from 'child_process';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || 'YOUR_CHAT_ID_HERE';
const PORT      = process.env.TV_CDP_PORT || '9223';
const POLL_MS   = 5000;

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

async function sendTelegram(msg) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' })
    });
    return await res.json();
  } catch(e) {
    console.error('Telegram send failed:', e.message);
  }
}

function toET(ts) {
  return new Date(ts * 1000).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function nowET() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

const watchingSTHs = new Map(); // sthTime → { high, etStr }
const alertedMSS   = new Set(); // sthTimes already fired

async function poll() {
  const data = tv('ohlcv --bars 100');
  if (!data.success || !data.bars) return;

  const bars = data.bars;

  bars.forEach(b => {
    b.etStr = toET(b.time);
    const [h, m] = b.etStr.split(':').map(Number);
    b.etH = h; b.etM = m;
  });

  // Bars from 8:30 AM ET only
  const filtered = bars.filter(b => b.etH > 8 || (b.etH === 8 && b.etM >= 30));
  if (filtered.length < 3) return;

  // ── Find STH pivots (N=1 strict, skip last forming bar) ──────────────
  for (let i = 1; i < filtered.length - 1; i++) {
    const prev = filtered[i - 1];
    const cur  = filtered[i];
    const next = filtered[i + 1];

    if (cur.high > prev.high && cur.high > next.high) {
      if (!watchingSTHs.has(cur.time) && !alertedMSS.has(cur.time)) {
        watchingSTHs.set(cur.time, { high: cur.high, etStr: cur.etStr });
        console.log(`[${nowET()}] 📍 STH @ ${cur.etStr} ET | ${cur.high} — watching for wick above`);
      }
    }
  }

  // ── Check for wick above each watched STH ────────────────────────────
  for (const [sthTime, sth] of watchingSTHs.entries()) {
    if (alertedMSS.has(sthTime)) continue;

    const postSTH = filtered.filter(b => b.time > sthTime);

    for (const bar of postSTH) {
      if (bar.high > sth.high) {
        alertedMSS.add(sthTime);
        watchingSTHs.delete(sthTime);

        const msg =
          `🔔 <b>BULLISH CONFIRMED</b>\n` +
          `📍 STH: ${sth.high} @ ${sth.etStr} ET\n` +
          `⚡ Wick above: ${bar.high} @ ${bar.etStr} ET\n` +
          `📈 Bias: LONG\n` +
          `💬 NQ M5`;

        console.log(`\n[${nowET()}] 🔔 BULLISH CONFIRMED`);
        console.log(`   STH: ${sth.high} @ ${sth.etStr} ET`);
        console.log(`   Wick above: ${bar.high} @ ${bar.etStr} ET`);

        await sendTelegram(msg);
        break;
      }
    }
  }
}

sendTelegram(
  `🚀 <b>Boyd-Walk_Away Bot Online</b>\n` +
  `Watching for M5 STH + wick above\n` +
  `Scan starts 8:30 AM ET | Every ${POLL_MS / 1000}s`
);

console.log(`🚀 Boyd-Walk_Away bot running — port ${PORT}`);
console.log(`   Watching: STH from 8:30 AM ET + wick above = bullish alert`);
console.log(`   Every ${POLL_MS / 1000}s — Ctrl+C to stop\n`);

poll();
setInterval(poll, POLL_MS);
