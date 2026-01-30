## Where To Adjust Countdown Coordinates
- The countdown “safe zone” bounds are controlled in [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx#L132-L181) inside the timer image wrapper (`relative inline-block ...`).
- Specifically, it’s the div currently using `absolute top-[25%] bottom-[25%] left-[15%] right-[15%] ...`.

Digit styling (font size, color, glow) for the device view is controlled in [CountdownTimer.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/CountdownTimer.tsx#L217-L233) inside the `variant === 'device'` block.

## What I Will Change (Exact to Your Spec)
### 1) Update Safe-Zone Bounds (Exact)
In [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx#L169-L180):
- Change the digit container to:
  - `absolute top-[28%] bottom-[28%] left-[15%] right-[15%] flex items-center justify-center`
This matches your “screen is 50% tall + 70% wide” findings and adds extra horizontal padding to avoid left bezel overflow.

### 2) Reduce Font Size + Final Polish (Exact)
In [CountdownTimer.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/CountdownTimer.tsx#L219-L232) for `variant="device"`:
- Use:
  - `text-[clamp(12px,2vw,32px)]`
  - `font-mono tracking-widest`
  - `text-green-500`
  - `drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]`
- Keep the timer rendered as a single centered string to prevent left-shift from `justify-between`.

### 3) Cleanup: Remove Micro-Grid Completely
In [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx#L143-L167):
- Delete the entire 20×20 ruler block:
  - `<div className="absolute inset-0 z-[100] ..."> ... </div>`

### 4) Verify
- Run TypeScript diagnostics and `npm run build` to ensure the cleaned hero compiles.

## Output You’ll Get After I Apply
- A clean hero timer: no debug grid.
- Digits confined to the dark screen area using the exact 28/15 bounds.
- A final Vue-style snippet for the center timer wrapper (if you need it for a Vue port), but the actual working implementation remains in TSX files in this repo.