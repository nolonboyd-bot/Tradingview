#!/usr/bin/env node
// telegram_alerts.js — Boyd-Walk_Away alert sequence
//
// ALERT 1: Wick above STH → on guard, bullish bias confirmed
//          🚨 if STH was inside a bearish FVG (significant)
//          🔔 standard wick above
//
// ALERT 2: Price touches an uncapped FVG (before or after STH) → entry zone
//          Uncapped = FVG that price has NOT returned to since it formed
//          Touch = price bar's range enters the FVG zone
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

// Find all bearish FVGs in bar array (bar[i].low > bar[i+2].high)
function findBearishFVGs(bars) {
  const fvgs = [];
  for (let i = 0; i < bars.length - 2; i++) {
    if (bars[i].low > bars[i + 2].high) {
      fvgs.push({
        top:     bars[i].low,
        bottom:  bars[i + 2].high,
        etStr:   bars[i + 1].etStr,
        barTime: bars[i + 1].time,
        type:    'bearish'
      });
    }
  }
  return fvgs;
}

// Find all bullish FVGs in bar array (bar[i+2].low > bar[i].high)
function findBullishFVGs(bars) {
  const fvgs = [];
  for (let i = 0; i < bars.length - 2; i++) {
    if (bars[i + 2].low > bars[i].high) {
      fvgs.push({
        bottom:  bars[i].high,
        top:     bars[i + 2].low,
        etStr:   bars[i + 1].etStr,
        barTime: bars[i + 1].time,
        type:    'bullish'
      });
    }
  }
  return fvgs;
}

// Check if an FVG is uncapped — no bar AFTER the FVG's barTime has traded back into the zone
function isUncapped(fvg, bars) {
  const afterBars = bars.filter(b => b.time > fvg.barTime);
  for (const b of afterBars) {
    // Bar trades into the zone if its range overlaps with [bottom, top]
    if (b.low <= fvg.top && b.high >= fvg.bottom) return false; // capped
  }
  return true; // uncapped
}

// Check if STH high falls inside a bearish FVG zone
function sthInsideFVG(sthHigh, fvgs) {
  return fvgs.find(f => sthHigh >= f.bottom && sthHigh <= f.top) || null;
}

// State
const watchingSTHs  = new Map(); // sthTime → { high, etStr, insideFVG, fvg }
const alertedMSS    = new Set(); // sthTimes that fired Alert 1
const watchingFVG   = new Map(); // sthTime → { sth, fvgsToWatch[] } — waiting for price to touch uncapped FVG
const alertedFVG    = new Set(); // sthTimes that fired Alert 2

async function poll() {
  const data = tv('ohlcv --bars 100');
  if (!data.success || !data.bars) return;

  const bars = data.bars;
  bars.forEach(b => {
    b.etStr = toET(b.time);
    const [h, m] = b.etStr.split(':').map(Number);
    b.etH = h; b.etM = m;
  });

  const filtered = bars.filter(b => b.etH > 8 || (b.etH === 8 && b.etM >= 30));
  if (filtered.length < 3) return;

  const bearishFVGs = findBearishFVGs(filtered);
  const bullishFVGs = findBullishFVGs(filtered);
  const allFVGs     = [...bearishFVGs, ...bullishFVGs];

  // ── STEP 1: Find STH pivots ───────────────────────────────────────────
  for (let i = 1; i < filtered.length - 1; i++) {
    const prev = filtered[i - 1];
    const cur  = filtered[i];
    const next = filtered[i + 1];

    if (cur.high > prev.high && cur.high > next.high) {
      if (!watchingSTHs.has(cur.time) && !alertedMSS.has(cur.time)) {
        const priorFVGs  = bearishFVGs.filter(f => f.barTime < cur.time);
        const matchedFVG = sthInsideFVG(cur.high, priorFVGs);
        watchingSTHs.set(cur.time, {
          high: cur.high, etStr: cur.etStr,
          insideFVG: !!matchedFVG, fvg: matchedFVG || null
        });
        const tag = matchedFVG
          ? `🚨 STH INSIDE FVG @ ${cur.etStr} | ${cur.high}`
          : `📍 STH @ ${cur.etStr} | ${cur.high}`;
        console.log(`[${nowET()}] ${tag} — watching for wick above`);
      }
    }
  }

  // ── STEP 2: Alert 1 — wick above STH ─────────────────────────────────
  for (const [sthTime, sth] of watchingSTHs.entries()) {
    if (alertedMSS.has(sthTime)) continue;

    const postSTH = filtered.filter(b => b.time > sthTime);
    for (const bar of postSTH) {
      if (bar.high > sth.high) {
        alertedMSS.add(sthTime);
        watchingSTHs.delete(sthTime);

        // Build Alert 1 message
        const significant = sth.insideFVG;
        const msg = significant
          ? `🚨 <b>SIGNIFICANT BULLISH — ON GUARD</b>\n` +
            `📍 STH inside FVG: ${sth.high} @ ${sth.etStr} ET\n` +
            `📦 FVG zone: ${sth.fvg.bottom} – ${sth.fvg.top}\n` +
            `⚡ Wick above: ${bar.high} @ ${bar.etStr} ET\n` +
            `⏳ Waiting for price to touch uncapped FVG\n` +
            `💬 NQ M5`
          : `🔔 <b>BULLISH — ON GUARD</b>\n` +
            `📍 STH: ${sth.high} @ ${sth.etStr} ET\n` +
            `⚡ Wick above: ${bar.high} @ ${bar.etStr} ET\n` +
            `⏳ Waiting for price to touch uncapped FVG\n` +
            `💬 NQ M5`;

        console.log(`\n[${nowET()}] ${significant ? '🚨 SIGNIFICANT' : '🔔'} BULLISH — ON GUARD`);
        console.log(`   STH: ${sth.high} @ ${sth.etStr} | Wick: ${bar.high} @ ${bar.etStr}`);
        await sendTelegram(msg);

        // Find uncapped FVGs — before the STH OR after it (up to and including MSS bar)
        const relevantFVGs = allFVGs.filter(f => f.barTime <= bar.time);
        const uncapped = relevantFVGs.filter(f => isUncapped(f, filtered.filter(b => b.time > f.barTime && b.time <= bar.time)));

        if (uncapped.length > 0) {
          console.log(`   Uncapped FVGs to watch (${uncapped.length}):`);
          uncapped.forEach(f => console.log(`     ${f.type} FVG @ ${f.etStr}: ${f.bottom} – ${f.top}`));
          watchingFVG.set(sthTime, { sth, mssBarTime: bar.time, fvgs: uncapped });
        } else {
          console.log(`   No uncapped FVGs found yet — will keep scanning`);
          watchingFVG.set(sthTime, { sth, mssBarTime: bar.time, fvgs: [] });
        }

        break;
      }
    }
  }

  // ── STEP 3: Alert 2 — price touches uncapped FVG ─────────────────────
  for (const [sthTime, entry] of watchingFVG.entries()) {
    if (alertedFVG.has(sthTime)) continue;

    // Refresh uncapped FVGs if list was empty (new FVGs may have formed)
    if (entry.fvgs.length === 0) {
      const allNow      = [...findBearishFVGs(filtered), ...findBullishFVGs(filtered)];
      const relevant    = allNow.filter(f => f.barTime <= entry.mssBarTime);
      const uncappedNow = relevant.filter(f => isUncapped(f, filtered.filter(b => b.time > f.barTime && b.time <= entry.mssBarTime)));
      if (uncappedNow.length > 0) {
        entry.fvgs = uncappedNow;
        console.log(`[${nowET()}] Found ${uncappedNow.length} uncapped FVG(s) to watch`);
      }
    }

    // Check if any bar AFTER the MSS has touched an uncapped FVG
    const postMSS = filtered.filter(b => b.time > entry.mssBarTime);
    for (const bar of postMSS) {
      for (const fvg of entry.fvgs) {
        if (bar.low <= fvg.top && bar.high >= fvg.bottom) {
          // Price touched the FVG
          alertedFVG.add(sthTime);
          watchingFVG.delete(sthTime);

          const msg =
            `🎯 <b>PRICE AT FVG — ENTRY ZONE</b>\n` +
            `📦 ${fvg.type === 'bearish' ? 'Bearish' : 'Bullish'} FVG: ${fvg.bottom} – ${fvg.top}\n` +
            `FVG formed: ${fvg.etStr} ET\n` +
            `⚡ Price touched @ ${bar.etStr} ET\n` +
            `📍 Related STH: ${entry.sth.high} @ ${entry.sth.etStr} ET\n` +
            `💬 NQ M5`;

          console.log(`\n[${nowET()}] 🎯 PRICE AT FVG — ENTRY ZONE`);
          console.log(`   FVG: ${fvg.bottom} – ${fvg.top} (${fvg.type}) | Touched @ ${bar.etStr}`);
          await sendTelegram(msg);
          break;
        }
      }
      if (alertedFVG.has(sthTime)) break;
    }
  }
}

sendTelegram(
  `🚀 <b>Boyd-Walk_Away Bot Online</b>\n` +
  `Alert 1: Wick above STH → on guard\n` +
  `Alert 2: Price touches uncapped FVG → entry\n` +
  `Scan from 8:30 AM ET | Every ${POLL_MS / 1000}s`
);

console.log(`🚀 Boyd-Walk_Away bot — port ${PORT}`);
console.log(`   Alert 1: Wick above STH → ON GUARD`);
console.log(`   Alert 2: Price touches uncapped FVG → ENTRY ZONE`);
console.log(`   Scan from 8:30 AM ET | Every ${POLL_MS / 1000}s — Ctrl+C to stop\n`);

poll();
setInterval(poll, POLL_MS);
