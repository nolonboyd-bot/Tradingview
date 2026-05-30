# Boyd-Walk_Away — Strategy Current State (Portable Snapshot)

**Snapshot date:** 2026-05-13
**Current spec version:** v1.3
**Status:** Phase 1 signal framework complete and mechanically reproducible. Entry/stop/target/risk **not yet defined** — strategy detects signals but does not yet produce quantified trades.
**Implementation phase:** Documentation. Pine chart markup, backtesting, and live trading all deferred (in that order).

---

## 0. ORIENTATION (for an AI picking this up cold)

Boyd-Walk_Away is a multi-phase intraday strategy under active design. We are in **Phase 1 (Bullish MSS Liquidity Reversal)** — a long-only post-9:30 ET setup model based on smart-money / ICT concepts: liquidity sweeps, mitigation of imbalance (FVGs), and Market Structure Shift (MSS) confirmation.

The strategy was authored iteratively today (2026-05-13) across versions v1.0 → v1.3. Each version added a layer of mechanical rigor so the same scan run twice produces the same result. Open items at the end of this document spell out the remaining gaps.

Naming convention: STHs are labeled A, B, C, … in chronological order. v1.0 was eyeballed. v1.1 made detection deterministic. v1.2 added depth/wick/dedupe filters. v1.3 added the structural FVG-mitigation filter.

---

## 1. STRATEGY IDENTITY

**Name:** Boyd-Walk_Away
**Phase 1 component:** Bullish MSS Liquidity Reversal Framework
**Inspired by:** ICT / smart-money concepts (FVGs, liquidity sweeps, MSS)
**Strategy type:** Intraday bullish reversal (long-only in Phase 1)
**Distinguishing element (TBD):** A "Walk Away" disengagement / exit-discipline mechanic — the rule that defines when the trader steps away from the screen (profit lock-in, loss cap, time-based, etc.). Not yet authored.

---

## 2. INSTRUMENT & TIMEFRAME

| Field | Value |
|---|---|
| Symbol(s) | Futures / Indices — examples on NQ (E-mini Nasdaq) |
| Primary execution timeframe | 5-minute |
| Higher timeframe (context) | Daily for PDH/PDL; intraday 12:00 AM ET Midnight Open |
| Sessions traded | RTH only, **post-9:30 AM ET** |
| Hard no-trade window | Before 9:30 AM ET |
| News blackout | Around CPI, FOMC, NFP, PPI, Fed speeches, Interest Rate Decisions |

---

## 3. ORIGINAL SOURCE FRAMEWORK (Phase 1, verbatim intent)

The user-provided source defines this 6-step sequence:

1. **STH forms** post-9:30 AM ET (Short-Term High = a recent local swing high on the 5-min chart).
2. **Price sells off** from the STH.
3. **Price trades into the Bearish Gap / Mitigation Zone** — a previously-formed bearish FVG / displacement zone / unfilled pricing area.
4. **Reversal begins from the mitigation zone** — selling weakens, price stabilizes. → Alert fires: *"Potential Bullish Structure Shift Detected."*
5. **Price returns toward the original STH** — rally back to the liquidity reference.
6. **A 5-min candle wicks above the STH** = **MSS confirmation** (Bullish Market Structure Shift).

Daily reference levels: PDH and PDL (use full candle wicks, not bodies). Intraday: 12:00 AM ET Midnight Open level.

The source explicitly says:
- The STH is NOT the confirmation — it is the liquidity reference point.
- The MSS confirmation is the wick above the STH, AFTER mitigation and reversal.
- The strategy avoids: random momentum entries, trading before 9:30, blind breakout chasing, indicator-only signals.

---

## 4. CURRENT MECHANICAL RULES (v1.3 — locked)

All four are required for a candidate to be classified as a valid Phase 1 setup.

### 4.1 STH Pivot Rule (§3.0)

```
A 5-min bar at index i is an STH iff:
    bar[i].high > bar[i-1].high
    AND bar[i].high > bar[i+1].high
```

This is an **N=1 strict pivot**. Ties (equal highs) do not qualify. The next bar must be **closed** before the STH is confirmed (no live-bar STHs).

### 4.2 Opening-Bar Exclusion (§3.1)

The STH bar must open at **9:35 AM ET or later**. The 9:30 RTH-open candle is excluded from STH eligibility (but may still serve as a left-side comparator).

### 4.3 Bullish Bias (§3.2)

Phase 1 is long-only. Bullish bias is confirmed by the MSS wick above the STH (see §4.4 F1).

### 4.4 Significance Filters (§3.3) — all four must PASS

| ID | Rule | Threshold | Purpose |
|---|---|---|---|
| **F1** | `MSS_bar.high − STH_price ≥ 10` NQ pts | 10 pts | Marginal wicks (<10 pts) are not real liquidity attacks — usually fade traps. |
| **F2** | `STH_price − selloff_low ≥ 50` NQ pts | 50 pts | Filters consolidation / continuation pullbacks from real mitigation moves. |
| **F3** | Multiple STHs that share the same mitigation-low bar AND same MSS bar are deduplicated to the **highest** STH. | structural | Eliminates triple-counting one liquidity pool from sub-pivots inside a rally. |
| **F4** | During the selloff window (STH bar to selloff-low bar inclusive), at least one bar must visit (1 tick inside or deeper) the zone of a bearish FVG **created before the STH bar**. | structural | Enforces the source's actual "trades into the Bearish Gap" requirement. A selloff that merely retraces deep without entering a prior imbalance is a continuation pullback, not a mitigation. |

Thresholds are NQ-specific (50 / 10 NQ pts). For other instruments these scale with volatility — TBD.

### 4.5 Bearish FVG Definition (§3.4)

```
For three consecutive 5-min bars [bar1, bar2, bar3]:
    BearishFVG := bar1.low > bar3.high
    zone_low   := bar3.high
    zone_high  := bar1.low
    width      := zone_high - zone_low
```

- The FVG comes into existence when `bar3` closes.
- No minimum width — any 3-bar imbalance counts.
- v1.3 does NOT require the FVG to be "live" (unmitigated). The zone remains a structural reference even after first touch.
- Pre-9:30 ET FVGs (overnight, pre-market) ARE eligible. The "no trading before 9:30" rule applies to trade execution, not to chart context.
- No displacement filter on bar2 in v1.3 (open item).

### 4.6 Backtest Scan Procedure (§12)

For every Phase 1 backtest, the analyst follows a deterministic algorithm:

**Step A** — List every 5-min RTH bar from 9:35 ET onward.

**Step B** — For each bar `b`, test §4.1 pivot rule. If `b.high > prev.high AND b.high > next.high`, mark as STH candidate.

**Step C** — For each STH candidate, evaluate the Phase 1 sequence (selloff → mitigation → reversal → return to STH → MSS wick). Record PASS/FAIL per step.

**Step C.5** — Apply significance filters F1, F2, F3, F4. Record pass/fail individually. Setup is VALID only if all four pass.

**Step D** — Produce an audit-trail table with one row per candidate STH. **Mandatory columns:**

| # | STH time | STH px | Selloff Δ | MSS time | MSS wick | Δ above STH | F1 | F2 | F3 | F4 | FVG zone (if F4 ✓) | Phase 1? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

**Step E** — Mark VALID setups on the chart (STH line + mitigation FVG rectangle + MSS confirmation label).

**Step F** — Report: count of candidates, count of valid setups, filter discard rate, and any rule-edge cases encountered.

**The mandatory audit table is what guarantees no silent skips** — even failing candidates appear with explicit reason. Eyeball scans are prohibited.

---

## 5. STILL UNDEFINED (TBD) — these block live trading

| Section | Item | Impact |
|---|---|---|
| §4 | **Entry trigger** — market on MSS bar close? Limit retrace to STH? Lower-TF FVG? | No quantified entry possible |
| §5 | **Stop loss** placement — below mitigation low? Below selloff low? With what buffer? | No quantified risk possible |
| §6 | **Take profit / target** — fixed R:R? PDH liquidity? Midnight Open re-test? Next STH? | No quantified target possible |
| §7 | **Trade management** — max open, EOD rule, break-even rule, **the "Walk Away" rule itself** | No exit discipline |
| §9 | **Risk parameters** — % per trade, max daily loss, contracts per setup | No position sizing |

Until §4–§7 and §9 are defined, the strategy detects signals but cannot place trades.

---

## 6. WORKED EXAMPLE — NQ 5-MIN, 2026-05-13 (the baseline session)

Strongly bullish trend day with V-shaped recovery: RTH low 29075 @ 09:45 → RTH high 29565.5 @ 14:20 (~490 pt range). Midnight Open: 29248.75. 9:30 RTH open: 29286.5.

### 6.1 STH candidates (per §4.1 + §4.2)

13 candidates enumerated, A–M chronologically.

### 6.2 Bearish FVGs found (per §4.5, mechanical 3-bar scan)

| FVG ID | Zone (low – high) | Width | Created |
|---|---|---|---|
| FVG-PM1 | 29354.5 – 29365 | 10.5 | 08:20 ET (pre-market) |
| **FVG-PM2** | **29292.25 – 29338** | **45.75** | **08:35 ET (pre-market, big displacement)** |
| FVG-O1 | 29261.5 – 29272.5 | 11 | 09:35 ET (RTH open area) |
| FVG-D1 | 29318.5 – 29318.75 | 0.25 | 11:25 ET (during selloff D) |
| FVG-L1 | 29545.25 – 29547.75 | 2.5 | 14:35 ET |
| FVG-L2 | 29495.25 – 29497.75 | 2.5 | 15:00 ET |

(Pre-existing reference: FVG-Y1 at 29135.75-29155.25 from May 12 16:05 — filled overnight.)

### 6.3 Full audit-trail table (per §4.6 Step D)

| # | STH time | STH px | Selloff low (time) | Selloff Δ | MSS time | MSS wick | Δ above STH | F1 | F2 | F3 | F4 | FVG (F4 ✓) | **Phase 1?** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 09:40 | 29265 | 29075 (09:45) | −190 | 10:25 | 29268.5 | +3.5 | ✗ | ✓ | ✓ | ✗ | — | FILTERED (F1+F4) |
| B | 09:55 | 29225.75 | 29112 (10:05) | −113.75 | 10:20 | 29245.25 | +19.5 | ✓ | ✓ | ✓ | ✗ | (no pre-existing bearish FVG in path) | **FILTERED (F4)** |
| **C** | **10:35** | **29280.5** | 29229.75 (10:40) | −50.75 | **10:50** | **29315** | **+34.5** | ✓ | ✓ | ✓ | **✓** | **FVG-O1** | **✓ VALID** |
| **D** | **11:00** | **29349.5** | 29281.5 (11:25) | −68 | **11:40** | **29386.75** | **+37.25** | ✓ | ✓ | ✓ | **✓** | **FVG-PM2** | **✓ VALID** |
| E | 11:20 | 29341.25 | 29281.5 (11:25) | −59.75 | 11:35 | 29344.75 | +3.5 | ✗ | ✓ | ✓ | ✓ | FVG-PM2 | FILTERED (F1) |
| F | 11:40 | 29386.75 | 29297 (11:55) | −89.75 | 12:10 | 29388.25 | +1.5 | ✗ | ✓ | ✓ | ✓ | FVG-PM2 | FILTERED (F1) |
| G | 12:25 | 29444.75 | 29422.5 (12:40) | −22.25 | 12:55 | 29463.5 | +18.75 | ✓ | ✗ | ✓ | ✗ | — | FILTERED (F2+F4) |
| H | 12:35 | 29449 | 29415.5 (12:50) | −33.5 | 12:55 | 29463.5 | +14.5 | ✓ | ✗ | ✓ | ✗ | — | FILTERED (F2+F4) |
| I | 13:15 | 29496.25 | 29441.5 (14:00) | −54.75 | 14:10 | 29523.5 | +27.25 | ✓ | ✓ | ✓ | ✗ | (no pre-existing bearish FVG in 29441-29496 range) | **FILTERED (F4)** |
| J | 13:25 | 29493.25 | 29441.5 (14:00) | −51.75 | 14:10 | 29523.5 | +30.25 | ✓ | ✓ | ✗ | ✗ | — | FILTERED (F3+F4) |
| K | 13:45 | 29488.75 | 29441.5 (14:00) | −47.25 | 14:05 | 29490.75 | +2 | ✗ | ✗ | ✓ | ✗ | — | FILTERED (F1+F2+F4) |
| L | 14:20 | 29565.5 | 29466.75 (14:55) | −98.75 | — | — | — | n/a | ✓ | ✓ | ✗ | — | PENDING (no MSS in session) |
| M | 15:45 | 29539.5 | 29449.5 (15:50) | −90 | post-RTH 16:50 | 29543 | +3.5 | ✗ | ✓ | ✓ | ✗ | — | FILTERED (F1+F4+post-RTH) |

**Result: 13 candidates → 2 VALID + 1 PENDING + 10 FILTERED. 77% discard rate.**

### 6.4 The two valid setups

**Setup C (10:35)** — STH 29280.5. Selloff −50.75 to 29229.75 @ 10:40. 10:40 bar closed at 29265.25, inside FVG-O1 (29261.5-29272.5). Reversal 10:50 close. MSS at 10:50 wick to 29315 (+34.5).

**Setup D (11:00)** — STH 29349.5. Selloff −68 to 29281.5 @ 11:25. Selloff bars 11:00–11:20 all printed inside FVG-PM2 (29292.25-29338, the pre-market displacement zone). Reversal 11:30 close. MSS at 11:40 wick to 29386.75 (+37.25). **Cleanest setup of the day.**

---

## 7. EVOLUTION — what each version fixed

| Version | Method | Discard logic | Today's "valid" count |
|---|---|---|---|
| v1.0 | Eyeballed | (none — analyst judgment) | 2 (D, I) — **MISSED Setup A @ 9:40** |
| v1.1 | Mechanical N=1 pivot, deterministic scan procedure (§12), mandatory audit table | (no filters — surfaces everything) | 13 (all candidates, including noise) |
| v1.2 | Adds F1 (MSS ≥+10 pts), F2 (selloff ≥50 pts), F3 (overlap dedupe) | statistical | 4 (B, C, D, I) — STH-B still passed |
| **v1.3** | **Adds F4 (selloff must visit pre-existing bearish FVG)** | **structural** | **2 (C, D)** — STH-B correctly filtered |

**The lesson from v1.0 → v1.1:** Any unwritten judgment becomes a silent filter. Silent filters cause silent misses. Cure: deterministic algorithm + mandatory audit table.

**The lesson from v1.2 → v1.3:** Statistical filters (depth) are a heuristic substitute for structural filters (mitigation of prior imbalance). Cure: encode the structural requirement directly.

---

## 8. OPEN ITEMS (Phase 1)

1. **Multi-day validation** — All thresholds (F1=10, F2=50, F4) and the F4 design (pre-9:30 FVGs eligible, no "freshness" requirement, no displacement filter on bar2) are tuned on a single session. Need 5–10 more days to confirm they generalize.
2. **§4 Entry trigger** — undefined. Candidates: market on MSS bar close / limit retrace to STH / lower-TF bullish FVG.
3. **§5 Stop loss** — undefined. Candidate: below mitigation low + buffer.
4. **§6 Target / R:R** — undefined. Candidates: fixed R:R, PDH liquidity, next 5-min STH above, Midnight Open re-test.
5. **§7 "Walk Away" rule** — undefined. The distinguishing mechanic of the strategy.
6. **§9 Risk parameters** — undefined.
7. **Mitigation zone tightening** — F4 uses any pre-existing bearish FVG. May need: "freshness" rule (first re-test only), "displacement" rule (bar2 body ≥60% of range), or "size" rule (min FVG width).
8. **Phase 2+ strategy content** — Bearish mirror? Continuation rules? Session-specific behavior?
9. **Non-NQ instrument thresholds** — F1/F2 are NQ-specific in points. Scale with ATR for other symbols.

---

## 9. WHAT WE'RE NOT DOING (intentional non-scope)

- **No live trading.** This is doc → Pine chart markup → backtest only. Live integration is a separate authorized phase.
- **No broker calls.** Order-routing tools are explicitly denied until §4–§7 + §9 are defined AND a separate live-trading plan is approved.
- **No bearish setups.** Phase 1 is long-only by source intent. A bearish mirror is potential future Phase 2+ content.
- **No HTF (15-min, 1H) confirmation requirement.** Source uses 5-min only; the framework treats Daily PDH/PDL and Midnight Open as reference levels, not bias filters.

---

## 10. PROMPT FOR ANOTHER AI

If you're an AI receiving this document as context to continue work on Boyd-Walk_Away, here's what's most useful to know:

1. **The rules above are LOCKED.** Don't relitigate §3.0, §3.1, §3.4, F1, F2, F3, F4. They were authored iteratively against empirical data and changes need explicit user approval with stated reason.
2. **The audit-trail table format is mandatory.** Every backtest produces one. No eyeball-scan summaries.
3. **The biggest open question is §4–§7 (entry/stop/target/Walk-Away rule).** Until that's defined, the strategy is a signal detector with no trade output.
4. **The "Walk Away" mechanic is the strategy's signature.** It's been TBD across all versions. The name suggests a disengagement / step-away rule (profit lock-in, loss cap, time-based). User has not specified.
5. **Verify before recommending.** Memory of v1.2 thresholds (50 pt selloff, 10 pt MSS) is current as of 2026-05-13 NQ baseline. Multi-day data may have changed them.
6. **Don't propose live-trading actions** until the user explicitly authorizes a live-trading plan with risk parameters defined.

---

*End of snapshot. Version: v1.3 · Date: 2026-05-13.*
