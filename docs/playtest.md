# Browser Playtest Checklist

## Setup

```bash
python3 -m http.server 8000
# Open http://localhost:8000 in browser
```

## Cache Busting

Stale browser assets are the #1 cause of "game doesn't work" reports.

**Before every playtest session:**

1. **Chrome DevTools** → Network tab → check "Disable cache"
2. **Or** hard reload: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
3. **Restart the server** from the repository root:
   ```bash
   # Kill old server first (Ctrl+C or kill %1)
   python3 -m http.server 8000
   ```

**Verify you're on the right build:**
- The footer should show the current commit hash (e.g., `10d42b6`)
- If the hash doesn't match `git log --oneline -1`, you have a cache issue

## Full Victory Run

1. **Start** — Only Croc weapon available (slots 2-3 disabled)
2. **Intro** — "MEGA MART" overlay fades after 3 seconds
3. **Wave 1** — Single Manager appears, patrols near storefront
4. **Hit enemy** — Score increases, hit counter rises, accuracy > 0%
5. **Miss (ground)** — Shoot past enemies, accuracy drops
6. **Miss (vehicle)** — Hit a parked car, "MISS" feedback or comedic message, accuracy drops, combo resets
7. **Wave 1 complete** — "+500 INCIDENT RESOLVED" announcement, score increases WITHOUT accuracy change
8. **Weapon unlock** — "WATER BALLOON UNLOCKED" announcement, slot 2 enabled
9. **Wave 2** — HOA + delayed Manager appear
10. **Ability fires** — Manager uses "CALL THE MANAGER" — Composure drops by 15, player slowed
11. **Wave 2 complete** — "+500" bonus, Garden Gnome unlocked
12. **Wave 3** — Retail Return + Manager + HOA (staggered)
13. **Final escalation** — 4 enemies over 12 seconds, slightly faster
14. **Victory** — "INCIDENT RESOLVED" → result screen after 1.5s
15. **Result screen** — Verify:
    - Score matches gameplay
    - Accuracy = hits / (hits + misses)
    - Weapon throws match what you fired
    - Rank displayed correctly
16. **Play Again** — Press R, game resets to intro with Croc only

## Defeat Run

17. **Let Composure drain** — Don't shoot enemies, wait for passive drain
18. **Ability drain** — Let abilities fire for additional composure loss
19. **Composure hits 0** — Defeat screen appears within 1.5s
20. **No further drain** — Composure stays at 0, no score changes
21. **Result screen** — Shows "YOU BECAME THE INCIDENT", defeat stats
22. **Restart** — Press R, full state reset (score, hits, misses, composure, unlocks)

## Debug Controls

23. **F3** — Toggle debug overlay (shows phase, composure, enemies alive)
24. **F6** — Advance to next phase (only in debug mode)
25. **F7** — Refill +25 composure (only in debug mode)

## Console Verification

Open browser console and run:
```js
window.__HTK_DEBUG__.weaponUnlocks()
// Should show: { croc: true, waterBalloon: false, gardenGnome: false }
// After Wave 1: { croc: true, waterBalloon: true, gardenGnome: false }
// After Wave 2: { croc: true, waterBalloon: true, gardenGnome: true }

window.__HTK_DEBUG__.score()
// Shows ScoreSystem state: score, combo, totalHits, totalMisses, accuracy

window.__HTK_DEBUG__.composure()
// Shows current composure value

window.__HTK_DEBUG__.phase()
// Shows current phase string
```

## Known Stub Behavior

- `updateWeaponSlots()` — no visual slot indicators (unlock communicated via announcement)
- `updateStatusEffects()` — no HUD icons for ESCALATED/SOAKED/CITED (effects still apply to gameplay)
- `showHitMarker()` — no crosshair hit marker visual
