# Smoke Test Checklist

Run these checks against a clean committed worktree. Start server with `python3 -m http.server 8000`.

## Startup
- [ ] Zero JS syntax errors in dev console
- [ ] Zero module/import 404s
- [ ] Zero undefined config errors
- [ ] Zero undefined THREE errors
- [ ] Scene renders with ground, parking lot, storefront

## Weapons
- [ ] Croc fires (key 1, left click)
- [ ] Switch to Water Balloon (key 2) — first-person view changes
- [ ] Water Balloon fires and ammo decreases from 12
- [ ] Switch to Garden Gnome (key 3) — first-person view changes
- [ ] Gnome fires and ammo decreases from 5
- [ ] Switch back to Croc (key 1) — first-person view changes
- [ ] Only one weapon view visible at a time
- [ ] Weapon slot bar highlights active weapon

## Archetypes
- [ ] Manager Karen patrols and confronts
- [ ] HOA Karen patrols and confronts
- [ ] Retail Return Karen patrols and confronts

## Abilities
- [ ] Manager Karen uses Call the Manager — ESCALATED appears on player HUD
- [ ] HOA Karen uses Violation Notice — HOA VIOLATION sign appears
- [ ] Retail Karen uses Return Without Receipt — returned item appears
- [ ] World effects expire after configured duration
- [ ] No ReferenceError in console

## Status Effects
- [ ] Water Balloon applies SOAKED to Karen on hit
- [ ] SOAKED lasts approximately 6 seconds
- [ ] Karen movement visibly slows while SOAKED
- [ ] Player enters HOA notice zone — CITED appears on player HUD
- [ ] Player enters returned item zone — RETURNED appears on player HUD
- [ ] All statuses expire on schedule
- [ ] HUD status badges show remaining time

## Splash
- [ ] Water Balloon splash affects secondary enemies within radius
- [ ] Secondary enemy can be defeated by splash damage
- [ ] Defeat scoring fires once per enemy
- [ ] Defeat audio plays once per enemy
- [ ] Respawn policy triggers once per enemy

## Defeat
- [ ] Karen takes damage, shows hit reaction
- [ ] Karen defeated — plays defeat animation
- [ ] Score increments
- [ ] Defeat audio plays
- [ ] Karen respawns after configured delay

## Respawn
- [ ] Respawned Karen has full health
- [ ] No SOAKED or other temporary statuses on respawn
- [ ] Speed returns to baseline
- [ ] Ability cooldowns reset
- [ ] No stale dialogue or status state

## Reset
- [ ] Press R to reset during active effects
- [ ] Press R during active statuses
- [ ] Press R during mid-flight projectiles
- [ ] Press R during Karen ability execution
- [ ] After every reset:
  - [ ] No duplicate enemies
  - [ ] No stale statuses on player
  - [ ] No stale world effects
  - [ ] No duplicate weapon meshes
  - [ ] No console errors
  - [ ] Ammo restored to starting values

## Debug Overlay
- [ ] F3 toggles debug overlay
- [ ] Shows FPS, frame time, projectile count
- [ ] Shows enemy count, spawn/respawn queues
- [ ] Shows VFX and world effect counts
- [ ] Shows draw calls, triangles, memory
