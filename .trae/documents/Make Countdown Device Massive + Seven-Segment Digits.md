## Why It Looks Like a Thumbnail
Right now the countdown device is constrained to `max-w-3xl` and a relatively small fixed height (`h-[300px] md:h-[400px]`). Also the digits show `--:--:--:--` because [CountdownTimer.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/CountdownTimer.tsx) explicitly renders placeholders when `unlockTimestamp` is undefined.

## Changes I Will Make
### 1) Make the Center Device Massive (Same Size for Timer + Modal)
In [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx), I will:
- Increase both State A and State B containers from `max-w-3xl` to `max-w-5xl` (≈ 900–1100px).
- Increase the fixed device height so it dominates the viewport:
  - `h-[420px] md:h-[560px] lg:h-[620px]`
- Apply the exact same width/height to the modal container to keep the transition seamless.

### 2) Replace Generic Dashes With Real Digits + Neon Glow
In [CountdownTimer.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/CountdownTimer.tsx):
- Change the “no timestamp” placeholder from `--:--:--:--` to `00:00:00:00` (still dimmed) so it never looks broken.
- Add an optional prop (e.g. `variant="device"`) so the timer can render a single-line `DD : HH : MM : SS` layout with larger digits and no labels/status (ideal for fitting into the PNG slots).

### 3) Add a Digital / Seven-Segment Style Font
I’ll import `Orbitron` (fast, clean HUD font) and apply it to the device digits:
- Add Google Fonts `<link>` to [index.html](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/index.html).
- Add a CSS utility class in [index.css](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/index.css), e.g. `.font-orbitron { font-family: 'Orbitron', ui-monospace, monospace; }`.
- Apply to the overlay digits with stronger neon glow: `drop-shadow-[0_0_12px_rgba(0,255,0,0.65)]`.

### 4) Align Digits to the PNG “Black Slots”
In [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx), I will adjust the overlay positioning:
- Move from `top-1/2` to a tuned percent offset (likely `top-[46%]`) and tune overlay width (`w-[62%]`) until the numbers sit exactly in the slot window.

### 5) Add Vertical Breathing Room Above Cards
Add spacing so the massive device doesn’t collide with the 3 pricing cards:
- Add `mb-8 md:mb-12` on the center device wrapper or increase `gap` between sections.

## Code Shape (Preview of the Refactor)
The center block will still be strict conditional, but with bigger dimensions:
- Timer state: `max-w-5xl h-[420px] md:h-[560px] lg:h-[620px]`
- Modal state: same exact size.

If you confirm, I’ll implement these edits across:
- [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx)
- [CountdownTimer.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/CountdownTimer.tsx)
- [index.html](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/index.html)
- [index.css](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/index.css)

…and verify the build still passes.