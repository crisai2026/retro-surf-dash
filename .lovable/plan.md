

## Plan: More Sharks, Fewer Waves, Swimmer Rescue Chain

All changes in `src/components/SurferGame.tsx`.

### 1. Spawn rate changes
- Change `SPAWN_INTERVAL` from 40 to **4** (10x more spawns overall).
- Change spawn probability: currently 40% shark / 60% wave. New ratio: ~91% shark, ~5.7% wave, ~3.3% swimmer. This means waves spawn at roughly 5% less than before in absolute terms, while sharks dominate.

### 2. New "swimmer" object type
- Add `"swimmer"` to the `Obj` type union.
- Draw a new `drawSwimmer` pixel-art function — a small person in the water with a different color (e.g., cyan/pink) to distinguish from the player surfer.
- Swimmers scroll down like waves/sharks at speed ~1.5.

### 3. Surfer chain (conga line) mechanic
- Add a `followers` array to game state: `{ x: number; y: number }[]` — each is a rescued swimmer trailing behind.
- When the player collides with a swimmer, add a new follower to the chain.
- Each follower follows the position of the one ahead of it (or the player) with a delay, creating a snake-like trail.
- Followers are drawn using the same `drawSwimmer` sprite, positioned below/behind the lead surfer.
- Track `savedCount` in state for total swimmers rescued.

### 4. Collision for followers
- Sharks hitting any follower in the chain removes that follower (and all behind it) — adding risk to having a long chain.

### 5. HUD updates
- Display `SAVED: X` count alongside score.
- Show current chain length.
- Game over screen shows total swimmers saved.

### Technical details
- Follower positions stored as a history buffer of the player's past positions; each follower reads from `N * spacing` frames back.
- Position history: push `surferX` each frame into a ring buffer array; follower `i` reads from `history[history.length - (i+1) * FOLLOW_DELAY]`.
- Spawn logic: `Math.random()` < 0.91 → shark, < 0.967 → wave, else → swimmer.

