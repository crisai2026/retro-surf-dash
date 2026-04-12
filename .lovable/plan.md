

## Plan: Gameplay Overhaul — Difficulty, Lives Cap, Chain Multiplier, Rebalanced Spawns

All changes in `src/components/SurferGame.tsx`.

### 1. Lives cap at 5
- When rescuing a swimmer: if `s.lives >= 5`, add +5 to score instead of `s.lives++`.
- Still add follower to chain regardless.

### 2. Progressive difficulty every 25 points
- Add `level` to state (starts at 0). Recalculate as `Math.floor(s.score / 25)`.
- When level increases, set a `levelUpTimer = 90` to flash "LEVEL UP!" on screen.
- Object speeds multiplied by `1 + level * 0.1` (shark base 2.2, wave 1.8, swimmer 1.5 — all scale).
- Shark spawn rate increases by `+0.02 * level` (capped so it doesn't exceed ~60%).

### 3. HUD: "NEXT: X" display
- Calculate `nextMilestone = (Math.floor(s.score / 25) + 1) * 25`.
- Render below score text.

### 4. Chain multiplier for waves
- Wave points = `1 + Math.floor(s.followers.length / 2)`.
- Add to `s.score` accordingly.

### 5. Rebalanced spawn rates
- Change from `0.55 / 0.965 / 1.0` thresholds to:
  - `r < 0.35` → shark
  - `r < 0.85` → wave (50%)
  - else → swimmer (15%)
- Shark threshold adjusted dynamically: `0.35 + 0.02 * level`.

### 6. "LEVEL UP!" flash
- When `levelUpTimer > 0`, draw centered yellow text "LEVEL UP!" and decrement timer each frame.

### Technical details
- Add `level`, `levelUpTimer` to `stateRef`.
- Speed scaling applied inline in the object movement section: `o.y += baseSpeed * (1 + s.level * 0.1)`.
- Spawn thresholds recalculated each spawn frame using current level.

