# Boyd-Walk_Away — Pending Rule Changes

These observations came up during live session review. None of these are locked into the strategy spec yet. Each needs multi-day validation before being merged into CurrentState.md.

---

## PENDING-1 — STH Timing Rule (§4.2 revision candidate)

**Date observed:** 2026-05-14
**Updated:** 2026-05-15
**Current v1.3 rule:** STH bar must open at 9:35 AM ET or later.
**Proposed change:** Start scanning for STHs at **8:30 AM ET**. The STH can form any time from 8:30 AM onward — pre-market or RTH. The MSS confirmation wick timing rule is still being evaluated (see PENDING-2).

**Rationale:** The 8:30 AM open is when pre-market liquidity becomes active and meaningful STHs begin forming. Today (2026-05-15) confirmed this — the key STH formed at 8:40 ET with MSS at 8:55 ET, well before the 9:30 RTH open. Starting the scan at 8:30 captures these setups. Starting at 9:35 misses them entirely.

**Observed on chart:**
- 2026-05-14 — pre-market STH with selloff into bearish FVG, MSS wick post-9:30
- 2026-05-15 — STH at 8:40 ET @ 29,190, MSS wick at 8:55 ET, big bullish follow-through

**What's needed before locking:**
- Validate 8:30 start time across 5+ sessions
- Confirm no false positives from 8:30–9:00 STHs with no follow-through
- Determine if there is a maximum lookback (e.g. only same-day pre-market, not prior session)

**Impact on scan procedure (§4.6):**
- Step A: begin bar scan at 8:30 AM ET each session
- Step B: STH pivot rule unchanged — N=1 strict pivot applies
- Step C/C.5: MSS timing rule under review (see PENDING-2)

---

## PENDING-2 — MSS Confirmation Direction (§4.3 observation)

**Date observed:** 2026-05-15
**Setup reviewed:** 8:40 ET STH @ 29,190 on NQ M5

**Observation:** The MSS confirmation wick is a wick **above** the STH level — not a rejection at it. When the 8:55 bar wicked above the 8:40 STH (29,190), that was the confirmation that price wanted to go **higher**. The signal is bullish — the STH liquidity is being swept, signaling a reversal to the upside.

**Sequence confirmed today:**
1. STH forms at 8:40 ET @ 29,190
2. Price sells off below the STH into the FVG zone (29,179–29,192)
3. 8:55 bar wicks **above** 29,190 (sweeps the STH)
4. That wick = MSS confirmation → bias is bullish → price goes higher
5. Big green follow-through candles confirmed the move

**Key distinction:** The trade signal is NOT a bearish rejection at the STH. It is the **wick through the STH that confirms the bullish reversal**. Price sweeps the liquidity sitting above the STH and then continues higher.

**What's needed before locking:**
- Validate the wick-above-STH pattern across 5+ sessions
- Confirm whether the MSS wick must close back below the STH or can close above
- Note: today's MSS (8:55 ET) was pre-9:30 — need to determine if pre-RTH MSS is valid or if 9:30 rule from PENDING-1 still applies

---

## PENDING-3 — Re-Entry Rule When Price Runs Away After STH Wick

**Date observed:** 2026-05-15

**Scenario:** Price wicks above the STH (bullish confirmed) but runs away before entry is possible. The move is already underway.

**Rule:** Do NOT chase. Wait for price to return to the lower FVG zone. Two outcomes from there:

**Outcome A — Bounce:**
- Price comes back to the lower FVG zone and holds
- FVG acts as support → enter long on the bounce
- Target: prior highs / continuation higher

**Outcome B — Lower Low (LL) + Bullish FVG:**
- Price pushes through the lower FVG, sweeps below it making a LL
- On the reversal back up, a bullish FVG forms on the price leg up
- That bullish FVG is the entry zone → enter long
- Target: back through the FVG zone and continuation higher

**Key principle:** The lower FVG is the re-entry reference either way. Whether price bounces off it or sweeps it making a LL, the FVG zone is what you're watching. The LL + bullish FVG scenario just means price needed more fuel (liquidity sweep) before the real move.

**What's needed before locking:**
- Validate both outcomes (bounce and LL+FVG) across multiple sessions
- Confirm whether the bullish FVG on the LL reversal must form on M5 or if smaller TF is acceptable

---

## PENDING-4 — STH Inside Bearish FVG + Wick Above = Significant Signal

**Date observed:** 2026-05-15

**Rule:** When an STH forms INSIDE a bearish M5 FVG and a subsequent bar wicks above that STH level, this is a **significantly stronger signal** than a standard STH wick.

**Why it's stronger:**
- The bearish FVG is an imbalance zone — price is drawn back into it
- When price enters the FVG and forms an STH there, it means the FVG zone is being tested from within
- The wick above the STH then clears BOTH the STH liquidity AND the FVG imbalance simultaneously
- Two confluences in one candle = higher conviction bullish setup

**The setup:**
1. Bearish FVG exists (identified by bar[i].low > bar[i+2].high on M5)
2. Price sells off below the FVG
3. Price rallies back up INTO the FVG zone
4. STH forms while price is inside the FVG (STH high is within the FVG range)
5. A subsequent bar wicks above the STH → **SIGNIFICANT bullish confirmation**

**vs Standard STH wick:**
- STH anywhere + wick above = bullish signal (standard)
- STH inside bearish FVG + wick above = significant bullish signal (higher conviction)

**Alert distinction:**
- Standard signal: 🔔 BULLISH CONFIRMED
- STH inside FVG signal: 🚨 SIGNIFICANT BULLISH — STH inside FVG confirmed

**What's needed before locking:**
- Validate across 5+ sessions
- Confirm FVG must be M5 or if HTF FVGs (15m, 1h) carry even more weight
- Determine minimum FVG size that qualifies (avoid noise from tiny gaps)

---

## PENDING-5 — Protected Low Rule (from PDF training guide)

**Date observed:** 2026-05-15
**Source:** NQ ICT State-Change FVG Strategy Training Guide

**Rule:** After the STH wick (state change), a **Protected Low** is established — the short-term low that formed BEFORE the state change. If price violates this protected low at any point after the state change, the setup is **invalid** and the entire process restarts from scratch.

**Impact on v1.3:** This is a new invalidation rule not currently in the spec. It protects against false state changes and ensures the bullish structure remains intact before entry.

**What's needed before locking:**
- Validate across sessions — how often does the protected low get taken out before entry?
- Define exactly which bar's low is the protected low (lowest low in the selloff window? the low just before the MSS bar?)

---

## PENDING-6 — Lower Timeframe Execution Model (from PDF training guide)

**Date observed:** 2026-05-15
**Source:** NQ ICT State-Change FVG Strategy Training Guide

**Rule:** After the M5 state change (wick above STH) and a valid M5 bullish FVG is identified, drop to the **30-second or 1-minute chart** for entry. On the lower timeframe, repeat the same state-change model:
1. Find a bearish FVG on the lower TF
2. Find a Short-Term High on the lower TF
3. Wait for one-tick violation of that lower-TF STH
4. Wait for bullish displacement
5. Enter from the resulting bullish FVG on the lower TF

**Key principle:** The lower timeframe repeats the same model as the higher timeframe. This fills in §4 (Entry trigger) from v1.3 which is currently undefined.

**Impact on v1.3:** Fills the undefined entry trigger (§4). Current spec detects signals but has no quantified entry — this provides it.

**What's needed before locking:**
- Validate lower-TF execution across multiple setups
- Confirm whether 30s or 1m is preferred for execution

---

## PENDING-7 — Discount Rule for STH Placement (from PDF training guide)

**Date observed:** 2026-05-15
**Source:** NQ ICT State-Change FVG Strategy Training Guide

**Rule:** The STH should preferably form in the **lower 50% of the range** (below equilibrium = discount). STHs forming above equilibrium (premium) are lower quality setups.

- Below EQ = Discount = preferred (better R:R, price can retrace without invalidating structure)
- Above EQ = Premium = lower conviction

**Impact on v1.3:** This would become a new significance filter (F5 candidate) or a quality rating for setups rather than a hard pass/fail.

**What's needed before locking:**
- Define what range is used to calculate EQ (session range? RTH open to current high?)
- Determine if this is a hard filter or just a quality flag

---

## PENDING-8 — Stop Loss, Breakeven & Target Rules (from PDF training guide)

**Date observed:** 2026-05-15
**Source:** NQ ICT State-Change FVG Strategy Training Guide

These fill in the undefined sections §5, §6, §7 from v1.3:

**Stop Loss (§5):**
- Place initial stop below the **protected low** (from PENDING-5) or the displacement low
- This is currently undefined in v1.3

**Breakeven Rule (§7):**
- When price moves **1R** (equal to initial risk) in your favor → move stop to breakeven (entry price)
- This does NOT lock profit, does NOT take partial profit
- It simply removes the possibility of a losing trade
- Possible outcomes become: +2R profit or 0 (breakeven)

**Profit Target (§6):**
- Minimum target: **2R** (risk/reward = 1:2)
- Example: 70 pt risk → 140 pt target

**What's needed before locking:**
- Validate 1:2 R:R across sessions — does NQ consistently deliver 2R on valid setups?
- Confirm stop placement (protected low vs displacement low — which is tighter?)
- This is the closest thing to defining the "Walk Away" rule — at 2R, you walk away

---

## PENDING-9 — One-Tick vs 10-Point MSS Filter Conflict (from PDF training guide)

**Date observed:** 2026-05-15
**Source:** NQ ICT State-Change FVG Strategy Training Guide

**Conflict identified:** 
- PDF says: "Only ONE TICK above the STH is required" for state change confirmation
- v1.3 F1 filter says: MSS wick must be ≥ 10 NQ pts above the STH

These directly conflict. The PDF allows a 1-tick wick as valid state change. v1.3 filters out anything less than 10 pts.

**Implication:** If the PDF rule is correct, v1.3's F1 filter (10 pt minimum) is too strict and is filtering valid setups.

**What's needed before locking:**
- Review filtered setups from v1.3 backtest — did any 1-tick to 9-pt wicks produce valid follow-through?
- User decision required: keep F1 as a quality filter (not hard disqualifier) or lower/remove the threshold

---

## PENDING-10 — Volume Imbalance Extends FVG Zone

**Date observed:** 2026-06-06

**Rule:** When a bearish FVG is identified, check whether a **volume imbalance** is adjacent to or overlapping with the FVG. If one exists, the full mitigation zone must include BOTH the FVG AND the volume imbalance — not just the FVG gap alone.

**Definitions:**
- **Bearish FVG zone** (standard): bar[i+2].high → bar[i].low (the three-candle gap)
- **Volume Imbalance (VI)**: occurs when bar[i].close and bar[i+1].open do not overlap — the candle BODIES leave a gap (separate from wick imbalance)
- **Extended zone**: if a VI is adjacent to the FVG, the full inefficiency zone = lowest boundary to highest boundary across both the FVG and the VI

**Why it matters:**
- The FVG alone captures the wick imbalance (gap between candle shadows)
- The volume imbalance captures the body gap — where no actual trading volume occurred
- Price is drawn to fill BOTH inefficiencies
- If you only mark the FVG and ignore the VI extension, you may mark the zone too tight and miss valid entries or misjudge the full mitigation target

**For alert purposes:**
- The "price touches uncapped FVG" alert (Alert 2) must trigger when price enters the combined zone (FVG + VI), not just the FVG alone
- The zone top and bottom used in telegram_alerts.js must be recalculated to encompass both

**Example:**
- FVG zone: 29,150 → 29,180
- Adjacent volume imbalance extends to: 29,145 → 29,185
- Full zone to watch: 29,145 → 29,185

**Impact on code:**
- `telegram_alerts.js`: FVG zone calculation needs to check for adjacent VI and expand zone boundaries
- `scan_sth_live.js`: When reporting FVG zones, report the full extended zone including VI

**What's needed before locking:**
- Validate across sessions — does including VI extension improve entry precision?
- Determine if VI must be on the same bar cluster as the FVG or if it can be on adjacent bars
- Determine if HTF VIs (15m, 1h) extend M5 FVG zones or are tracked separately

---

*Add future pending rule changes below this line.*

---

*Last updated: 2026-06-06 | Status: OBSERVATION ONLY — not merged into spec*
