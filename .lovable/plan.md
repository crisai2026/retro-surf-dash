

## Plan: Add Retro 8-Bit Sound Effects

All changes in `src/components/SurferGame.tsx`. No external dependencies needed — we'll use the Web Audio API to synthesize classic 8-bit sounds programmatically.

### 1. Create an AudioContext and sound functions

Add a lazy-initialized `AudioContext` (created on first user interaction to comply with browser autoplay policies). Create three synthesized sound functions:

**`playWaveSound()`** — Super happy wave catch:
- Rapid ascending arpeggio (C5→E5→G5→C6) using square wave oscillator
- Each note ~80ms, bright and cheerful
- Like a classic power-up jingle

**`playRescueSound()`** — Happy "yay" rescue:
- Two-tone ascending chime (C4→E4) with triangle wave
- Slightly longer notes (~120ms), warmer tone
- Add a quick vibrato wobble for personality

**`playSharkSound()`** — Scream-like shark hit:
- Descending pitch sweep from ~800Hz to ~200Hz using sawtooth wave
- ~300ms duration with high gain for intensity
- Add noise-like quality by layering a second detuned oscillator
- Mimics an 8-bit scream/death sound

### 2. Wire sounds to collision events

In the game loop's collision detection (around lines 230-260):
- Wave collision → `playWaveSound()`
- Swimmer collision → `playRescueSound()`  
- Shark collision (player) → `playSharkSound()`
- Shark collision (follower) → shorter version of shark sound

### 3. Game over sound

Add a `playGameOverSound()` — descending three-note sequence (E4→C4→A3) to play when lives reach 0.

### Technical details
- `AudioContext` stored in a `useRef` to persist across renders
- All sounds use `OscillatorNode` + `GainNode` with exponential ramp-downs for clean cutoffs
- Square/sawtooth waves give authentic 8-bit character
- No external files or API calls needed

