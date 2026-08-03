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

## Abilities — Manager Karen (Call the Manager)
- [ ] Manager Karen telegraphs ability ("I'm calling the MANAGER!")
- [ ] Player receives ESCALATED status after telegraph completes
- [ ] HUD shows ESCALATED badge with countdown
- [ ] Player movement speed reduced while ESCALATED
- [ ] ESCALATED expires after ~4 seconds
- [ ] Manager Karen returns to confrontation/patrol after ability completes
- [ ] Ability enters cooldown (~25s) before next use
- [ ] No ability fires every frame — only once per activation

## Abilities — HOA Karen (Violation Notice)
- [ ] HOA Karen telegraphs ability ("HOA VIOLATION!")
- [ ] HOA VIOLATION sign appears in world at place distance
- [ ] Entering sign radius applies CITED status to player
- [ ] HUD shows CITED badge with countdown
- [ ] CITED applies movement modifier
- [ ] Notice expires after configured duration (~12s)
- [ ] CITED expires after ~5 seconds
- [ ] F3 debug shows effect radius ring
- [ ] Ability enters cooldown (~20s) before next use

## Abilities — Retail Return Karen (Return Without Receipt)
- [ ] Retail Karen telegraphs ability ("I don't need a receipt!")
- [ ] Returned item appears at Karen position
- [ ] Entering item radius applies RETURNED status to player
- [ ] HUD shows RETURNED badge with countdown
- [ ] Item expires after configured duration (~15s)
- [ ] RETURNED expires after ~3 seconds
- [ ] Ability enters cooldown (~30s) before next use

## Ability Lifecycle
- [ ] TELEGRAPHING: Karen shows dialogue, stops movement (SPECIAL state)
- [ ] EXECUTING: Gameplay payload fires exactly once
- [ ] COMPLETE: Karen returns to prior state, dialogue cleared
- [ ] No ability fires multiple times per activation
- [ ] No callback calls ability.use() recursively
- [ ] Console shows no uncaught exceptions during ability execution

## Status Effects
- [ ] Water Balloon applies SOAKED to Karen on hit
- [ ] SOAKED lasts approximately 6 seconds
- [ ] Karen movement visibly slows while SOAKED
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
- [ ] Ability cooldowns reset — ability available after try interval
- [ ] No stale dialogue or status state
- [ ] Defeated + respawned archetype can use ability again

## Reset
- [ ] Press R to reset during active effects
- [ ] Press R during active statuses
- [ ] Press R during mid-flight projectiles
- [ ] Press R during Karen ability telegraph
- [ ] Press R during Karen ability execution
- [ ] After every reset:
  - [ ] No duplicate enemies
  - [ ] No stale statuses on player
  - [ ] No stale world effects
  - [ ] No duplicate weapon meshes
  - [ ] No console errors
  - [ ] Ammo restored to starting values
  - [ ] All abilities reset to ready state

## Console
- [ ] Zero uncaught exceptions
- [ ] No getter-only currentDialogue assignment error
- [ ] No missing THREE error
- [ ] No module 404 error
- [ ] No ability re-entry error

## Debug Overlay
- [ ] F3 toggles debug overlay
- [ ] Shows FPS, frame time, projectile count
- [ ] Shows enemy count, spawn/respawn queues
- [ ] Shows VFX and world effect counts
- [ ] Shows draw calls, triangles, memory

## Visual Identity — Weapons
- [ ] Croc held in first person has recognizable foam clog shape
- [ ] Croc has ventilation holes, heel strap, toe box
- [ ] Croc projectile in flight looks like a clog
- [ ] Water Balloon is semi-translucent with tied neck
- [ ] Water Balloon projectile has internal color variation
- [ ] Garden Gnome has red pointed hat, white beard, blue shirt
- [ ] Garden Gnome projectile rotates visibly
- [ ] First-person hand supports weapon presentation
- [ ] Weapon throw animation plays with visible motion

## Visual Identity — Environment
- [ ] Sky gradient renders (blue sky to warm horizon)
- [ ] Distant tree silhouettes visible
- [ ] Distant building silhouettes visible
- [ ] Lighting has warm late-afternoon quality
- [ ] Shadows cast in consistent direction
- [ ] Scene does not look uniformly lit

## Visual Identity — Characters
- [ ] Karen characters use stylized human proportions
- [ ] Karen hair is visible (asymmetric bob)
- [ ] Different Karen archetypes have visual distinction

## Ability Context Verification
- [ ] Manager Karen ability executes WITHOUT "[CallManagerAbility] Missing playerStatusController" warning
- [ ] HOA Karen ability executes WITHOUT "[ViolationNoticeAbility] Missing worldEffectSystem" warning
- [ ] Retail Return ability executes WITHOUT "[ReturnWithoutReceiptAbility] Missing worldEffectSystem" warning
- [ ] ESCALATED status appears on player HUD after Manager ability completes
- [ ] Player movement speed visibly reduced while ESCALATED
- [ ] ESCALATED expires and speed returns to normal
- [ ] HOA VIOLATION world notice spawns in scene (visible as effect zone)
- [ ] Walking into notice zone applies CITED status to player
- [ ] CITED appears on HUD with countdown
- [ ] Returned item world effect spawns at Retail Karen position
- [ ] Walking into returned item zone applies RETURNED status to player
- [ ] RETURNED appears on HUD with countdown
- [ ] Console has zero "Missing playerStatusController" warnings during gameplay
- [ ] Console has zero "Missing worldEffectSystem" warnings during gameplay

## VFX Lifecycle Verification
- [ ] Manager phone glow/pulse appears during telegraph
- [ ] Manager phone glow disappears when ability executes
- [ ] Manager red alert triangle fades out after ~800ms
- [ ] HOA glow/sparks appear during telegraph
- [ ] HOA flash plane appears and scales out during execute
- [ ] Retail highlight/papers appear during telegraph
- [ ] Retail drop plane appears and fades during execute
- [ ] No VFX meshes remain attached after ability completes
- [ ] Reset mid-telegraph clears all VFX immediately
- [ ] Respawn mid-telegraph clears all VFX and resets pose
- [ ] No "Cannot read properties of undefined" errors from expired VFX
- [ ] No double-dispose errors on shared geometries

## Camera Feedback Verification
- [ ] Garden Gnome hit produces strongest camera impulse
- [ ] Croc hit produces moderate camera impulse
- [ ] Water Balloon hit produces barely-noticeable impulse
- [ ] Camera impulse decays smoothly (no jitter or stutter)
- [ ] No motion sickness from camera feedback
