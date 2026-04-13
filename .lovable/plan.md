

## Plan: Improve Mobile Touch Controls

The current touch control uses absolute positioning (surfer moves toward where you touch) with a slow lerp factor of 0.15, making it feel sluggish. The canvas is also fixed at 480x640px which may be too small or overflow on phones.

### Changes

#### 1. Faster, more responsive touch tracking (`SurferGame.tsx`)
- Increase the lerp factor from `0.15` to `0.35` for snappier response to finger movement
- Add **relative drag mode**: on `touchstart`, record the initial touch X and the surfer's current X. On `touchmove`, move the surfer by the delta from the initial touch position (1:1 finger-to-surfer mapping), not toward an absolute target. This feels much more natural on mobile.

#### 2. Make canvas scale to fit phone screens (`SurferGame.tsx`)
- Replace the fixed `SCALE = 2` sizing with a dynamic style that uses `max-width: 100vw` and `max-height: 85vh` while preserving aspect ratio
- The canvas native resolution stays 240x320, but the CSS size adapts to the screen
- Add `touch-action: none` CSS to prevent browser scroll/zoom interference

#### 3. Add on-screen pause button for mobile (`SurferGame.tsx`)
- During gameplay, render a small "⏸" tap target in the top-right corner of the canvas (drawn on the canvas itself)
- Detect taps in that region to toggle pause, since phones have no P key

#### 4. Prevent page scroll and bounce on touch (`SurferGame.tsx`)
- Add `touch-action: none` to the canvas element and the wrapper div to fully prevent scroll interference during gameplay

### Technical details
- Touch state changes from a single `touchRef` number to an object: `{ startTouchX, startSurferX, currentTouchX }`
- Movement calculation: `surferX = startSurferX + (currentTouchX - startTouchX)` (clamped to bounds)
- Canvas style: `width: min(${CANVAS_W * SCALE}px, 100vw)`, `height: auto`, `aspect-ratio: 240/320`
- Pause button: 20x20 region at top-right; check touch coordinates against it in `handleTouchStart`

