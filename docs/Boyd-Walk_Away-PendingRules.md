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

*Add future pending rule changes below this line.*

---

*Last updated: 2026-05-15 | Status: OBSERVATION ONLY — not merged into spec*
